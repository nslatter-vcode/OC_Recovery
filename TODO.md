# TODO

## OpenClaw efficiency
- [ ] Heartbeat: implement local (Ollama) preflight + Mini fallback + instant Telegram/Discord alert when local is unavailable.
      Note: In this deployment, if Ollama is down it may imply broader infra issues; still useful to detect and alert early.
- [ ] Mini-tier model: pick a *valid* cheaper model for routine tasks.
      Preferred routing idea: Ollama (llama3.1:8b) for routine text + openai-codex/gpt-5.3-codex-spark for cloud text + openai-codex/gpt-5.2 for vision/heavy.
- [ ] Memory system: revisit semantic memory_search/recall (embeddings provider keys) + discuss Maya “personality”/mode settings.
      Goal: use memory intentionally without bloating always-loaded context.
