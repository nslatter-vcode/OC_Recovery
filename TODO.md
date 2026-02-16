# TODO

## OpenClaw efficiency
- [ ] Heartbeat: implement local (Ollama) preflight + Mini fallback + instant Telegram/Discord alert when local is unavailable.
      Note: In this deployment, if Ollama is down it may imply broader infra issues; still useful to detect and alert early.
- [ ] Mini-tier model: pick a *valid* cheaper model for routine tasks. Attempted openai-codex/gpt-4.1-mini but it is marked **missing/unknown** in `openclaw models list`, causing "Unknown model" failures when set as default.
      Action: decide whether to use Ollama for most routine work or add/configure a real cloud "mini" model that is available.
