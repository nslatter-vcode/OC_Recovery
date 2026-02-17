#!/usr/bin/env bash
set -euo pipefail
cd /home/maya/.openclaw/workspace/dashboard

export NODE_ENV=production
export HOSTNAME=0.0.0.0
export PORT=3010

# Ensure dependencies are installed
if [ ! -d node_modules ]; then
  npm ci
fi

# Ensure build exists
if [ ! -d .next ]; then
  npm run build
fi

exec npm run start -- --hostname "$HOSTNAME" --port "$PORT"
