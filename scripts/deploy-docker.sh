#!/usr/bin/env bash

set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-docker}"
REMOTE_DIR="${REMOTE_DIR:-/home/mike/compose/meal-planner}"
SERVICE_URL="${SERVICE_URL:-http://127.0.0.1:8787/api/health}"
REMOTE_RELEASE_DIR="${REMOTE_DIR}/.incoming-$(date +%s)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

printf 'Deploying meal planner to %s:%s\n' "${REMOTE_HOST}" "${REMOTE_DIR}"

ssh "${REMOTE_HOST}" "mkdir -p '${REMOTE_DIR}/data' '${REMOTE_RELEASE_DIR}'"
COPYFILE_DISABLE=1 tar \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '.DS_Store' \
  --exclude '._*' \
  --exclude 'data' \
  --exclude 'dist' \
  --exclude 'node_modules' \
  --exclude '*.log' \
  -czf - \
  -C "${REPO_ROOT}" \
  . | ssh "${REMOTE_HOST}" "tar -xzf - -C '${REMOTE_RELEASE_DIR}'"

ssh "${REMOTE_HOST}" "cd '${REMOTE_DIR}' && for item in * .[^.]*; do case \"\$item\" in '*'|'.[^.]*'|.|..|.env|data|.incoming-*) continue ;; *) rm -rf -- \"\$item\" ;; esac; done && cp -a '${REMOTE_RELEASE_DIR}/.' '${REMOTE_DIR}/' && rm -rf '${REMOTE_RELEASE_DIR}'"

ssh "${REMOTE_HOST}" "cd '${REMOTE_DIR}' && if [ ! -f .env ]; then cp .env.example .env; fi"
if [ -f "${REPO_ROOT}/.env" ]; then
  scp "${REPO_ROOT}/.env" "${REMOTE_HOST}:${REMOTE_DIR}/.env.tmp"
  ssh "${REMOTE_HOST}" "mv '${REMOTE_DIR}/.env.tmp' '${REMOTE_DIR}/.env' && chmod 600 '${REMOTE_DIR}/.env'"
fi
ssh "${REMOTE_HOST}" "cd '${REMOTE_DIR}' && docker compose config >/dev/null"
ssh "${REMOTE_HOST}" "cd '${REMOTE_DIR}' && docker compose up -d --build"

printf '\nWaiting for health check at %s on %s\n' "${SERVICE_URL}" "${REMOTE_HOST}"
ssh "${REMOTE_HOST}" "for i in \$(seq 1 30); do if curl -fsS '${SERVICE_URL}' >/dev/null; then exit 0; fi; sleep 2; done; exit 1"

printf '\nContainer status:\n'
ssh "${REMOTE_HOST}" "cd '${REMOTE_DIR}' && docker compose ps"

printf '\nRecent logs:\n'
ssh "${REMOTE_HOST}" "cd '${REMOTE_DIR}' && docker compose logs --tail=40 meal-planner"
