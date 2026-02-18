#!/usr/bin/env bash
set -euo pipefail

HOURS="${1:-24}"
DASH_JSON="/home/maya/.openclaw/workspace/sanctum-core/public/spend-report-latest.json"

python3 "/home/maya/.openclaw/workspace/scripts/spend_report.py" --hours "$HOURS" --json-out "$DASH_JSON"
