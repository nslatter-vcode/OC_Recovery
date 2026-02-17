#!/usr/bin/env bash
set -euo pipefail
cd /home/maya/.openclaw/workspace/dashboard
npm ci
npm run build
