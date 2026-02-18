# Tech & Ops snapshot

## Models & routing
- Local: Ollama `llama3.1:8b` at `10.20.30.238:11434`, CPU-only (12-core i7-12700K, 64GB RAM), running 24/7 for cheap text tasks.
- Cloud: `openai-codex/gpt-5.1-codex-mini` is now primary with fallback to `openai-codex/gpt-5.2`; spark is not default but available if needed.
- Rule: prefer Ollama for scheduled automation (briefs, logs). If output is poor or includes images, escalate to `gpt-5.1-codex-mini`, then to `gpt-5.2` for vision/troubleshooting.
- Screen attachments: auto-run OCR; if text-only pipeline works, keep on cheap model; escalate to `gpt-5.2` if necessary.

## Dashboard + reports
- Dashboard located at `/workspace/sanctum-core`; Next.js served via systemd user service on `0.0.0.0:3010` using `npm run start`.
- Spend pipeline:
  - `scripts/spend_report.py` now supports `--json-out` + `--history-out` (JSONL). History stored at `~/.openclaw/state/spend-history.jsonl` for trend analysis.
  - Nightly 3am cron jobs update dashboard snapshot + history and deliver markdown to Telegram + Discord.
- Daily 7am briefs + weekly CEO reviews use strict exec commands: run spend report, sed TODO/COO_LOG; they write to tmp for context. Discord job now clean.

## Services
- Dashboard service script: `scripts/dashboard_prod_start.sh` (ensures npm ci/build) and `dashboard_prod_build.sh` (build helper). Service unit stored under `systemd/openclaw-dashboard.service` for reference.
- Memory handling now tracked under `memory/domains/`. Weekly cleanup plan to prune/arx.
