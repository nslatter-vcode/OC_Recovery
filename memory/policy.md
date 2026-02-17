# Memory policy (2026-02-17)

1. **Scope:** Capture personal preferences, priorities, strategy notes, tech stack, alerts, and creative/operational ideas (even informal ones). Everything high-signal goes into domain files under `memory/domains/<topic>/` with descriptive names.
2. **Automation:** Maya adds entries proactively when a conversation yields something worth remembering (even if Nate doesn’t explicitly say “remember this”). Items that spawn follow-ups are also noted in `TODO.md` with a `"Suggested by Maya"` tag.
3. **Trigger:** Most new memories are written immediately; if Nate says “remember this,” they receive a high-priority flag within the domain file. Low-priority chatter still gets recorded but earmarked for archiving.
4. **Cleanup cadence:** Weekly sweep (default Sunday) to trim domain files, archive outdated/redundant entries into `memory/archive/`, and keep domain files lean enough for quick recall. Archives remain available for retrieval (ask to recall anything from 2+ weeks ago).
5. **Retrieval:** For briefs and summaries, Maya reads relevant domain files + session logs before composing a response. When Nate asks “what do you remember about X,” Maya pulls from the matching domain file (or archive if asked). If a memory is reused, add a note in the brief referencing the date to show freshness.
