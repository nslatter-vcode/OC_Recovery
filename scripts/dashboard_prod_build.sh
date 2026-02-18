#!/usr/bin/env bash
set -euo pipefail
cd /home/maya/.openclaw/workspace/sanctum-core
npm ci
npm run build
