#!/usr/bin/bash
#
# Certbot deploy hook -- reload nginx after a successful renewal.
#
# Install to /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh (mode 0755).
# Certbot runs every executable in that directory after any certificate is
# renewed, and only then.
#
# This is not optional. nginx reads the certificate once at startup and caches
# it in memory, so a renewed certificate on disk is invisible to a running
# nginx until it is reloaded. Without this hook the site keeps serving the old
# certificate until something else happens to restart the container -- which
# is a silent failure that looks exactly like a failed renewal.
#
# `nginx -s reload` is a graceful reload: workers finish in-flight requests
# before exiting, so there is no dropped connection and no downtime.

set -euo pipefail

COMPOSE_FILE="${IVM_COMPOSE_FILE:-/opt/ivm/docker-compose.prod.yml}"
SERVICE=nginx

log() {
	# Goes to the certbot log (and to cron/journal via certbot's own output).
	echo "[reload-nginx] $*"
}

if [[ ! -f "$COMPOSE_FILE" ]]; then
	log "ERROR: compose file not found at $COMPOSE_FILE"
	log "Set IVM_COMPOSE_FILE if the application lives elsewhere."
	exit 1
fi

compose() {
	docker compose -f "$COMPOSE_FILE" "$@"
}

if [[ -z "$(compose ps -q "$SERVICE" 2>/dev/null)" ]]; then
	# Nothing to reload. Not an error: the certificate on disk is fine and
	# nginx will pick it up whenever it next starts. Failing here would mark
	# an otherwise successful renewal as failed.
	log "nginx container is not running; nothing to reload"
	exit 0
fi

# Validate before reloading. A reload with a bad config leaves the old workers
# running, but failing loudly here surfaces the problem while the old
# certificate is still valid rather than at the next restart.
if ! compose exec -T "$SERVICE" nginx -t; then
	log "ERROR: nginx config test failed; refusing to reload"
	exit 1
fi

compose exec -T "$SERVICE" nginx -s reload
log "nginx reloaded; now serving ${RENEWED_LINEAGE:-renewed certificate}"
