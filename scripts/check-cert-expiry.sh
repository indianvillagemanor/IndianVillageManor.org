#!/usr/bin/bash
#
# TLS certificate health check with dead-man's-switch alerting.
#
# Run daily from cron as root (see docs/DEPLOYMENT.md section 8.3). Checks
# three things that can each independently take the site down, and reports to
# an external monitor:
#
#   1. Days remaining on the certificate nginx is actually SERVING.
#   2. Days remaining on the certificate stored ON DISK by certbot.
#   3. Whether those two are the same certificate.
#
# Check 3 is what catches a renewal that succeeded on disk but was never
# picked up by the running nginx -- the failure mode the deploy hook exists to
# prevent, and the one that is otherwise invisible until the site breaks.
#
# Alerting is a dead-man's-switch: the check pings a Healthchecks.io URL on
# success, so the monitor alerts on the ABSENCE of a ping. That covers the case
# this whole script exists for -- silent failure -- as well as the host dying,
# cron being removed, or the network going away. A failing check pings the
# /fail endpoint instead, which alerts immediately.
#
# Exit status: 0 healthy, 1 warning/critical, 2 could not complete the check.
# It is safe to run by hand at any time; without HEALTHCHECK_URL set it simply
# prints a report and exits with the appropriate status.

set -uo pipefail

CONFIG_FILE="${IVM_CERT_CHECK_CONFIG:-/etc/ivm/cert-check.env}"
# shellcheck source=/dev/null
[[ -r "$CONFIG_FILE" ]] && source "$CONFIG_FILE"

HOSTNAME_TO_CHECK="${CERT_HOSTNAME:-indianvillagemanor.org}"
# 21 days leaves three weeks to react. Certbot renews at 30 days remaining and
# retries twice daily, so a healthy system renews nine days before this fires;
# reaching 21 days means renewal has already failed ~18 times in a row.
WARN_DAYS="${CERT_WARN_DAYS:-21}"
LIVE_DIR="${CERT_LIVE_DIR:-/etc/letsencrypt/live/$HOSTNAME_TO_CHECK}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-}"

report=""
status=0

say() {
	report+="$*"$'\n'
	echo "$*"
}

fail() {
	# Worst status wins: a hard error is not downgraded by a later warning.
	local level=$1
	shift
	say "$*"
	[[ $level -gt $status ]] && status=$level
	return 0
}

# Seconds-since-epoch for an openssl notAfter string, or empty on failure.
to_epoch() {
	date -d "$1" +%s 2>/dev/null
}

days_until() {
	echo $(((  $1 - $(date +%s) ) / 86400 ))
}

# --- certificate on disk (what certbot manages) ---------------------------

disk_end=""
disk_serial=""
disk_days=""
if [[ -r "$LIVE_DIR/fullchain.pem" ]]; then
	disk_end=$(openssl x509 -noout -enddate -in "$LIVE_DIR/fullchain.pem" 2>/dev/null | cut -d= -f2)
	disk_serial=$(openssl x509 -noout -serial -in "$LIVE_DIR/fullchain.pem" 2>/dev/null | cut -d= -f2)
	disk_epoch=$(to_epoch "$disk_end")
	if [[ -n "$disk_epoch" ]]; then
		disk_days=$(days_until "$disk_epoch")
		say "on disk:  expires $disk_end (${disk_days}d) serial ${disk_serial}"
	else
		fail 2 "on disk:  ERROR could not parse expiry from $LIVE_DIR/fullchain.pem"
	fi
else
	# Not fatal on its own -- the served certificate is the thing users hit --
	# but it means certbot has nothing to renew, which is a real problem.
	fail 2 "on disk:  ERROR cannot read $LIVE_DIR/fullchain.pem (run as root?)"
fi

# --- certificate being served (what users actually get) -------------------

served=$(echo | timeout 15 openssl s_client \
	-servername "$HOSTNAME_TO_CHECK" \
	-connect "$HOSTNAME_TO_CHECK:443" 2>/dev/null |
	openssl x509 -noout -enddate -serial 2>/dev/null)

live_days=""
if [[ -n "$served" ]]; then
	live_end=$(grep '^notAfter=' <<<"$served" | cut -d= -f2)
	live_serial=$(grep '^serial=' <<<"$served" | cut -d= -f2)
	live_epoch=$(to_epoch "$live_end")
	if [[ -n "$live_epoch" ]]; then
		live_days=$(days_until "$live_epoch")
		say "served:   expires $live_end (${live_days}d) serial ${live_serial}"
	else
		fail 2 "served:   ERROR could not parse expiry from $HOSTNAME_TO_CHECK:443"
	fi
else
	fail 2 "served:   ERROR could not retrieve certificate from $HOSTNAME_TO_CHECK:443"
fi

# --- evaluate -------------------------------------------------------------

[[ -n "$live_days" && $live_days -lt $WARN_DAYS ]] &&
	fail 1 "WARNING: served certificate expires in ${live_days}d (threshold ${WARN_DAYS}d) -- renewal is not working"

[[ -n "$disk_days" && $disk_days -lt $WARN_DAYS ]] &&
	fail 1 "WARNING: on-disk certificate expires in ${disk_days}d (threshold ${WARN_DAYS}d) -- certbot renewal is failing"

# Same expiry but different serial is normal only for a few seconds mid-renewal;
# persistently different means nginx never reloaded.
if [[ -n "$disk_serial" && -n "${live_serial:-}" && "$disk_serial" != "${live_serial:-}" ]]; then
	fail 1 "WARNING: served certificate differs from the one on disk -- nginx has not reloaded since renewal (deploy hook missing or failed)"
fi

[[ $status -eq 0 ]] && say "OK: certificate healthy, ${live_days}d remaining"

# --- report to external monitor ------------------------------------------

if [[ -n "$HEALTHCHECK_URL" ]]; then
	endpoint="$HEALTHCHECK_URL"
	[[ $status -ne 0 ]] && endpoint="${HEALTHCHECK_URL%/}/fail"
	curl -fsS -m 15 --retry 3 --retry-delay 5 \
		--data-raw "$report" "$endpoint" >/dev/null 2>&1 ||
		echo "check-cert-expiry: WARNING could not reach monitor at $endpoint" >&2
fi

exit $status
