# Monitoring

Operational monitoring for the IVM production host. This covers external
availability checks and certificate expiry; in-application performance
instrumentation is described in `docs/planning/M20-performance-monitoring.md`.

## Design principle: alert on absence, and alert from outside

The 2026-06-15 certificate expiry (see `docs/DEPLOYMENT.md` section 8.1) went
unnoticed for 55 days despite the failing job running twice daily for ~85 days.
Nothing was broken about the detection of the error — certbot logged a clear
message every time. What was missing was any path from that message to a human.

Two properties follow from that, and they shape everything below:

1. **Alert on the absence of success, not the presence of failure.** A job that
   only speaks up when it fails is indistinguishable from a job that is not
   running at all. A dead-man's-switch — a monitor that expects a regular
   check-in and alerts when one does not arrive — covers the failure, the
   crashed host, the deleted cron entry, and the network outage with one
   mechanism.
2. **Check from outside the host.** A monitor running on the box cannot report
   that the box is down. On-host checks are useful for detail, but the
   escalation path has to originate elsewhere.

## Layer 1: external uptime and certificate monitoring

The first line of defence, and the one to set up first. A third-party service
polls the public URL and alerts when it stops answering. This requires no code
and runs off-host, so it reports outages the server itself cannot.

UptimeRobot is what is deployed; Better Stack and Pingdom are equivalent.
Configure:

| Setting | Value |
| --- | --- |
| Monitor type | **Keyword** (a distinct type in the dropdown, not an option on an HTTP(s) monitor) |
| URL | `https://indianvillagemanor.org/api/health` |
| Keyword | `"status":"ok"` — the whole string including quotes; substring match, whitespace-exact |
| Alert when | Keyword **does not exist** |
| Interval | 5 minutes |
| Alert contacts | At least two people, at least one by SMS |

The keyword field only appears after switching the type dropdown from `HTTP(s)`
to `Keyword`; there is no separate field for a value, because the match is a
plain substring against the response body.

**As of August 2026, SSL expiry alerting appears to have moved to UptimeRobot's
paid tiers**, though their pricing page still lists it under Free — verify
against your own dashboard rather than their marketing pages. This does not
leave you exposed: UptimeRobot validates TLS on ordinary checks, so an expired
certificate fails the check and raises a normal down alert. What the paid
feature adds is *advance* warning, which Layer 2 below provides for free. If
advance warning through this provider matters to you, Better Stack and Notifier
both include SSL monitoring on their free tiers.

Run **two** monitors, not one. A plain HTTP(s) monitor catches TLS failures and
connection errors; the keyword monitor catches a healthy-looking 200 served
while Postgres is down. Neither subsumes the other.

Point the check at `/api/health` rather than `/`. That endpoint verifies
database connectivity, so a keyword match on `"status":"ok"` catches a Postgres
outage that a check against the homepage would miss — the homepage is
statically prerendered and returns 200 with the database down.

Add a second monitor for `https://www.indianvillagemanor.org/`, expecting a
301. `www` is on the certificate and covered by the `includeSubDomains` HSTS
directive, so it can break independently of the apex.

## Layer 2: certificate check with dead-man's-switch

`scripts/check-cert-expiry.sh`, run daily from cron as root. Installation is in
`docs/DEPLOYMENT.md` section 8.4.

It checks three things:

1. Days remaining on the certificate nginx is **serving**.
2. Days remaining on the certificate certbot holds **on disk**.
3. Whether those are the **same certificate**.

Check 3 is the one that is hard to get any other way. If renewal succeeds but
the nginx reload hook fails, the certificate on disk is perfectly healthy while
users get an expired one — `certbot certificates` reports everything is fine
right up until the site breaks. Comparing the serial numbers surfaces that
within a day.

The default 21-day threshold is deliberately well inside certbot's 30-day
renewal window. A healthy system renews at 30 days and never approaches it;
crossing 21 days means renewal has already failed about 18 consecutive times,
and still leaves three weeks to intervene.

Alerting uses [Healthchecks.io](https://healthchecks.io) (free tier is
sufficient). The script pings the check URL on success and `<url>/fail` on
failure. Configure the check with a **period of 1 day and a grace of 2 days**,
so a host that stops reporting alerts on the third day.

Set `HEALTHCHECK_URL` in `/etc/ivm/cert-check.env`. With it unset the script
still prints a report and exits non-zero on a problem, which is useful when
running it by hand:

```bash
sudo /opt/ivm/scripts/check-cert-expiry.sh; echo "exit=$?"
```

```text
on disk:  expires Nov  7 17:49:02 2026 GMT (89d) serial 05BB87...
served:   expires Nov  7 17:49:02 2026 GMT (89d) serial 05BB87...
OK: certificate healthy, 89d remaining
exit=0
```

Exit status is 0 healthy, 1 warning or critical, 2 the check could not run.

## Layer 3: renewal dry-run in the deployment checklist

`certbot renew --dry-run` performs a real ACME challenge against the staging
server using the stored authenticator, without consuming rate limits. It is the
only check that proves renewal will actually work *before* it needs to.

The specific hazard is that renewal depends on nginx configuration — the ACME
location block — that is edited for unrelated reasons and only exercised once
every 60 days. A regression there is invisible for two months.

**Run `sudo certbot renew --dry-run` after any change to
`nginx/templates/default.conf.template`.** This is listed in the section 7
redeploy verification steps.

## What is deliberately not monitored here

- **Certbot's own failure email.** Let's Encrypt sends expiry warnings to the
  registered ACME account address at 20 and 1 days. Useful as a backstop, but
  it depends on that address being one somebody reads — confirm with
  `sudo certbot show_account`. Do not rely on it as the primary alert.
- **Cron mail.** The host has no MTA, so anything written to stdout or stderr
  by a cron job is discarded. This is the mechanism that hid the original
  failure; nothing in this document depends on it.
- **In-app certificate reporting.** Surfacing expiry in `/api/health` or the
  admin console was considered and rejected: it is in-band (unreachable
  precisely when the certificate is broken) and requires someone to be looking
  at a dashboard.

## Verification

After setup, confirm each layer independently:

```bash
# Layer 1 -- trigger a test alert from the provider's UI, confirm it arrives

# Layer 2
sudo /opt/ivm/scripts/check-cert-expiry.sh; echo "exit=$?"
# Force a failure to confirm the alert path works end to end:
sudo CERT_WARN_DAYS=999 /opt/ivm/scripts/check-cert-expiry.sh; echo "exit=$?"

# Layer 3
sudo certbot renew --dry-run
```

The forced failure is worth doing. An alerting path that has never fired is an
assumption, not a control — which is the whole lesson of the outage this
document exists to prevent.
