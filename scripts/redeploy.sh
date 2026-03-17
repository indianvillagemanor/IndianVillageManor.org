#!/usr/bin/bash
#

set -e # exit onany error
set -x # show commands 

cd "$APP_DIR"
git pull origin main

echo Always include --build so runtime image stays in sync
docker compose -f "$COMPOSE_FILE" up -d --build

echo Verify container processes after update
docker compose -f "$COMPOSE_FILE" ps

echo Verify container responses after update
docker compose -f "$COMPOSE_FILE" exec app wget -qO- http://127.0.0.1:3000/api/health

echo Verify nginx health endpoint after update
curl http://127.0.0.1/nginx-health

echo Verify nginx response after update
curl -I "https://$HOSTNAME"
