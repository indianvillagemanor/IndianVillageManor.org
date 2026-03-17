#!/usr/bin/bash

set -euo pipefail
set -x

compose() {
	docker compose -f "$COMPOSE_FILE" "$@"
}

dump_failure_context() {
	set +e
	echo "Redeploy failed. Current container state:" >&2
	compose ps >&2

	echo "Recent migrate logs:" >&2
	compose logs migrate --tail=200 >&2 || true

	echo "Recent nginx logs:" >&2
	compose logs nginx --tail=120 >&2 || true
}

trap dump_failure_context ERR

cd "$APP_DIR"
git pull origin main

echo "Always include --build so runtime image stays in sync"
compose up -d --build

echo "Verify container processes after update"
compose ps

echo "Verify container responses after update"
compose exec app wget -qO- http://127.0.0.1:3000/api/health

echo "Verify nginx health endpoint after update"
curl http://127.0.0.1/nginx-health

echo "Verify nginx response after update"
curl -I "https://$HOSTNAME"
