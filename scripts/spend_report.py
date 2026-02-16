#!/usr/bin/env python3
"""OpenClaw spend report (local).

Reads OpenClaw session JSONL logs and prints a short markdown report.
Defaults: last 24 hours.

Outputs:
- totals (assistant turns only)
- tool call counts
- top largest assistant turns
- per-session totals

This is intentionally self-contained (no external deps).
"""

from __future__ import annotations

import argparse
import datetime as dt
import glob
import json
import os
from collections import Counter, defaultdict


def parse_ts(ts: str | None) -> dt.datetime | None:
    if not ts:
        return None
    # JSONL timestamps look like 2026-02-16T23:24:21.565Z
    if ts.endswith("Z"):
        ts = ts[:-1] + "+00:00"
    try:
        return dt.datetime.fromisoformat(ts)
    except Exception:
        return None


def money(x) -> str:
    return f"${x:,.4f}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sessions-glob", default=os.path.expanduser("~/.openclaw/agents/main/sessions/*.jsonl"))
    ap.add_argument("--hours", type=float, default=24.0)
    ap.add_argument("--now", default=None, help="ISO timestamp override (for testing)")
    ap.add_argument("--json-out", default=None, help="Write a JSON summary snapshot to this path")
    args = ap.parse_args()

    now = parse_ts(args.now) if args.now else dt.datetime.now(dt.timezone.utc)
    window_start = now - dt.timedelta(hours=args.hours)

    files = sorted(glob.glob(args.sessions_glob))
    if not files:
        print("# OpenClaw Spend Report\n\nNo session logs found.")
        return 0

    assistant_turns = []  # (ts, tokens, cost, toolnames, session_id)
    tool_counts = Counter()
    session_totals = defaultdict(lambda: {"tokens": 0, "cost": 0.0, "assistant": 0, "tool_turns": 0})

    # map file->session id
    session_id_by_file = {}

    for fp in files:
        sid = os.path.basename(fp).replace(".jsonl", "")
        session_id_by_file[fp] = sid
        with open(fp, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                if obj.get("type") != "message":
                    continue
                msg = obj.get("message") or {}
                if msg.get("role") != "assistant":
                    continue

                ts = parse_ts(obj.get("timestamp"))
                if not ts or ts < window_start:
                    continue

                usage = msg.get("usage") or {}
                tokens = int(usage.get("totalTokens") or 0)
                cost = float(((usage.get("cost") or {}).get("total")) or 0.0)

                tools = []
                for c in msg.get("content") or []:
                    if (c or {}).get("type") == "toolCall":
                        nm = (c or {}).get("name")
                        if nm:
                            tools.append(nm)
                tool_counts.update(tools)

                sid = session_id_by_file[fp]
                st = session_totals[sid]
                st["tokens"] += tokens
                st["cost"] += cost
                st["assistant"] += 1
                if tools:
                    st["tool_turns"] += 1

                assistant_turns.append((ts, tokens, cost, tuple(tools), sid))

    if not assistant_turns:
        print(f"# OpenClaw Spend Report\n\nNo assistant turns in the last {args.hours:g}h.")
        return 0

    assistant_turns.sort(key=lambda x: x[0])

    total_tokens = sum(t[1] for t in assistant_turns)
    total_cost = sum(t[2] for t in assistant_turns)
    count = len(assistant_turns)
    avg_tokens = total_tokens / max(count, 1)
    max_tokens = max(t[1] for t in assistant_turns)

    top_turns = sorted(assistant_turns, key=lambda x: x[1], reverse=True)[:5]

    # per-session table
    per_session = sorted(
        ((sid, st["assistant"], st["tool_turns"], st["tokens"], st["cost"]) for sid, st in session_totals.items()),
        key=lambda x: x[3],
        reverse=True,
    )[:10]

    print("# OpenClaw Spend Report")
    print("")
    print(f"Window: last {args.hours:g}h (UTC) — {window_start.isoformat(timespec='seconds')} → {now.isoformat(timespec='seconds')}")
    print("")
    print("## Totals (assistant turns only)")
    print(f"- Assistant turns: **{count}**")
    print(f"- Total tokens: **{total_tokens:,}**")
    print(f"- Total cost: **{money(total_cost)}**")
    print(f"- Avg tokens/turn: **{avg_tokens:,.0f}**")
    print(f"- Max tokens/turn: **{max_tokens:,}**")
    print("")

    print("## Top tool calls")
    for name, n in tool_counts.most_common(8):
        print(f"- {name}: {n}")
    if not tool_counts:
        print("- (no tool calls)")
    print("")

    print("## Largest turns (by total tokens)")
    for ts, tokens, cost, tools, sid in top_turns:
        tool_str = ",".join(tools) if tools else "none"
        print(f"- {ts.isoformat(timespec='seconds')} — {tokens:,} tokens — {money(cost)} — tools={tool_str} — session={sid}")
    print("")

    print("## Per-session totals (top 10)")
    for sid, a_cnt, tool_cnt, tok, cost in per_session:
        print(f"- {sid}: turns={a_cnt}, tool-turns={tool_cnt}, tokens={tok:,}, cost={money(cost)}")

    if args.json_out:
        os.makedirs(os.path.dirname(os.path.abspath(args.json_out)), exist_ok=True)
        snapshot = {
            "generatedAt": now.isoformat(timespec="seconds"),
            "window": {
                "hours": args.hours,
                "start": window_start.isoformat(timespec="seconds"),
                "end": now.isoformat(timespec="seconds"),
            },
            "totals": {
                "assistantTurns": count,
                "totalTokens": total_tokens,
                "totalCost": total_cost,
                "avgTokensPerTurn": avg_tokens,
                "maxTokensPerTurn": max_tokens,
            },
            "toolCalls": dict(tool_counts.most_common()),
            "largestTurns": [
                {
                    "ts": ts.isoformat(timespec="seconds"),
                    "tokens": tokens,
                    "cost": cost,
                    "tools": list(tools),
                    "session": sid,
                }
                for ts, tokens, cost, tools, sid in top_turns
            ],
            "perSession": [
                {
                    "session": sid,
                    "assistantTurns": a_cnt,
                    "toolTurns": tool_cnt,
                    "tokens": tok,
                    "cost": cost,
                }
                for sid, a_cnt, tool_cnt, tok, cost in per_session
            ],
        }
        with open(args.json_out, "w", encoding="utf-8") as jf:
            json.dump(snapshot, jf, indent=2)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
