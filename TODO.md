# TODO

## OpenClaw efficiency
- [ ] Heartbeat: implement local (Ollama) preflight + Mini fallback + instant Telegram/Discord alert when local is unavailable.
      Note: In this deployment, if Ollama is down it may imply broader infra issues; still useful to detect and alert early.
- [x] Mini-tier model: routing set to Ollama/5.1-codex-mini (with GPT‑5.2 fallback) so routine work stays cost efficient.
- [ ] Memory system: revisit semantic memory_search/recall (embeddings provider keys) + discuss Maya “personality”/mode settings.
      Goal: use memory intentionally without bloating always-loaded context.
