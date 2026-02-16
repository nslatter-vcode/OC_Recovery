#!/usr/bin/env bash
set -euo pipefail

HOURS="${1:-24}"
python3 "$(dirname "$0")/spend_report.py" --hours "$HOURS"
