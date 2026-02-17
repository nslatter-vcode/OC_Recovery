#!/usr/bin/env python3
"""OpenClaw spend report (local).

Reads OpenClaw session JSONL logs and prints a short markdown report.
Defaults: last 24 hours.
"""

from __future__ import annotations

import argparse
import datetime as dt
import glob
import json
import os
from collections import Counter, defaultdict
from typing import List, Tuple


def parse_ts(ts: str | None) -> dt.datetime | None:
    if not ts:
        return None
    if ts.endswith("Z"):
        ts = ts[:-1] + "+00:00"
    try:
        return dt.datetime.fromisoformat(ts)
    except Exception:
        return None


def money(x) -> str:
    return f"${x:,.4f}"


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sessions-glob", default=os.path.expanduser("~/.openclaw/agents/main/sessions/*.jsonl"))
    ap.add_argument("--hours", type=float, default=24.0)
    ap.add_argument("--now", default=None, help="ISO timestamp override (for testing)")
    ap.add_argument("--json-out", default=None, help="Write a JSON summary snapshot to this path")
    ap.add_argument("--history-out", default=None, help="Append a JSON snapshot line to this JSONL path")
    ap.add_argument("--coo-log", default=None, help="Path to COO_LOG.md for journal summaries")
    ap.add_argument("--todo", default=None, help="Path to TODO.md for context")
    ap.add_argument("--journal-out", default=None, help="Write a JSON journal entry to this path")
    ap.add_argument("--journal-history", default=None, help="Append journal entry JSONL to this path")
    ap.add_argument("--signal-out", default=None, help="Write the daily signal JSON to this path")
    ap.add_argument("--signal-history", default=None, help="Append the signal JSONL to this path")
    ap.add_argument("--home-out", default=None, help="Write the Yggdrasil home payload JSON to this path")
    return ap.parse_args()


def parse_todo_items(todo_path: str) -> Tuple[List[str], List[str]]:
    if not todo_path or not os.path.exists(todo_path):
        return [], []
    tasks: List[str] = []
    completed: List[str] = []
    with open(todo_path, "r", encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()
            if stripped.startswith("- [ ]") or stripped.startswith("- []"):
                parts = stripped.split("]", 1)
                if len(parts) > 1:
                    tasks.append(parts[1].strip())
            elif stripped.startswith("- [x]") or stripped.startswith("- [X]"):
                parts = stripped.split("]", 1)
                if len(parts) > 1:
                    completed.append(parts[1].strip())
    return tasks, completed


def read_last_log_block(coo_path: str) -> Tuple[str, List[str]]:
    if not coo_path or not os.path.exists(coo_path):
        return "", []
    with open(coo_path, "r", encoding="utf-8") as f:
        lines = [line.rstrip() for line in f]

    sections: List[Tuple[str, List[str]]] = []
    current_title = None
    current_lines: List[str] = []
    for line in lines:
        if line.startswith("## "):
            if current_title is not None:
                sections.append((current_title, current_lines))
            current_title = line[3:].strip()
            current_lines = []
        elif current_title is not None and line.strip():
            current_lines.append(line.strip())
    if current_title is not None:
        sections.append((current_title, current_lines))
    return sections[-1] if sections else ("", [])


def filter_lines(lines: List[str], keywords: List[str]) -> List[str]:
    results: List[str] = []
    lower_keywords = [k.lower() for k in keywords]
    for line in lines:
        text = line.lstrip("-* ").strip()
        low = text.lower()
        if any(keyword in low for keyword in lower_keywords):
            results.append(text)
    return results


def load_jsonl(path: str | None) -> List[dict]:
    if not path or not os.path.exists(path):
        return []
    entries: List[dict] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except Exception:
                continue
    return entries


def append_jsonl(path: str | None, entry: dict) -> None:
    if not path:
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a", encoding="utf-8") as hf:
        hf.write(json.dumps(entry) + "\n")


def write_json(path: str | None, entry: dict) -> None:
    if not path:
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as jf:
        json.dump(entry, jf, indent=2)


def safe_context(raw: str) -> str:
    text = raw.replace("\n", " ").strip()
    if len(text) > 80:
        text = text[:77] + "..."
    return text or "this focus"


def select_unique_line(templates: List[str], used: List[str], seed: int) -> str:
    if not templates:
        return ""
    start = seed % len(templates)
    for i in range(len(templates)):
        candidate = templates[(start + i) % len(templates)]
        if candidate not in used:
            return candidate
    return templates[start]


def find_signal_for_date(entries: List[dict], date_str: str) -> dict | None:
    for entry in reversed(entries):
        if entry.get("date") == date_str:
            return entry
    return None


def build_signal_entry(
    now: dt.datetime,
    date_str: str,
    total_tokens: int,
    log_lines: List[str],
    today_tasks: List[str],
    history: List[dict],
) -> dict:
    existing = find_signal_for_date(history, date_str)
    if existing:
        return existing

    context = today_tasks[0] if today_tasks else (log_lines[0] if log_lines else "operational clarity")
    ann = safe_context(context)
    humor_templates = [
        "Yggdrasil is perfectly content when {context} is the summit we climb today.",
        "While the cosmos dreams of thunder, we kept {context} on the checklist.",
        "The mythic scale still stands while we grind through {context}."
    ]
    reflection_templates = [
        "Clarity lives where {context} is measurable rather than lavish.",
        "Strategy today meant knotting {context} into a single thread.",
        "Momentum is simply {context} translated into concrete tasks."
    ]
    recent_humor = [entry.get("humor") for entry in history[-30:] if entry.get("humor")]
    recent_reflection = [entry.get("reflection") for entry in history[-30:] if entry.get("reflection")]
    humor = select_unique_line(humor_templates, recent_humor, total_tokens)
    reflection = select_unique_line(reflection_templates, recent_reflection, total_tokens + 7)

    return {
        "date": date_str,
        "generatedAt": now.isoformat(timespec="seconds"),
        "humor": humor.format(context=ann),
        "reflection": reflection.format(context=ann),
        "context": ann,
        "totalTokens": total_tokens,
    }


def find_previous_movement(history: List[dict]) -> dict:
    for entry in reversed(history):
        movement = entry.get("whatWeDid")
        if movement:
            return {"date": entry.get("logDate") or entry.get("generatedAt"), "movement": movement}
    return {"date": "", "movement": []}


def collect_blockers(log_lines: List[str]) -> List[str]:
    blockers = filter_lines(log_lines, ["blocker", "blocked", "blocking", "block"])
    if not blockers:
        return ["No blockers. Execution available."]
    return blockers


def cardified(items: List[str], prefix: str) -> List[dict]:
    cards: List[dict] = []
    for i, item in enumerate(items, 1):
        title, detail = item, ""
        if ":" in item:
            parts = item.split(":", 1)
            title = parts[0].strip()
            detail = parts[1].strip()
        words = title.split()
        short_title = " ".join(words[:3])
        if len(words) > 3:
            short_title = short_title or title
            short_title += "..."
        cards.append(
            {
                "id": f"{prefix}-{i}",
                "title": short_title or title or "Untitled",
                "detail": detail or item,
            }
        )
    return cards


def build_home_payload(
    date_str: str,
    signal_entry: dict,
    total_tokens: int,
    total_cost: float,
    today_tasks: List[dict],
    tomorrow_tasks: List[dict],
    previous_movement: dict,
    blockers: List[dict],
) -> dict:
    return {
        "date": date_str,
        "signal": signal_entry,
        "today": today_tasks,
        "yesterday": previous_movement,
        "tomorrow": tomorrow_tasks,
        "blockers": blockers,
        "summary": {
            "totalTokens": total_tokens,
            "totalCost": total_cost,
        },
    }


def build_journal_entry(
    now: dt.datetime,
    hours: float,
    total_tokens: int,
    total_cost: float,
    log_title: str,
    log_lines: List[str],
    todo_items: List[str],
) -> dict:
    what_we_did = [line.lstrip("-* ") for line in log_lines[:6]]
    problems = filter_lines(log_lines, ["problem", "issue", "block", "fail"])
    struggles = filter_lines(log_lines, ["struggle", "hard", "challenge", "friction"])
    accomplishments = filter_lines(log_lines, ["win", "accomplish", "done", "key"]) or what_we_did[:3]

    if not what_we_did:
        what_we_did = ["Captured spend + log data; no explicit notes found."]
    if not problems:
        problems = ["No explicit problems called out in COO log; everything nominal."]
    if not struggles:
        struggles = ["No additional struggles captured."]

    entry = {
        "generatedAt": now.isoformat(timespec="seconds"),
        "window": {
            "hours": hours,
            "start": (now - dt.timedelta(hours=hours)).isoformat(timespec="seconds"),
            "end": now.isoformat(timespec="seconds"),
        },
        "logDate": log_title,
        "whatWeDid": what_we_did,
        "problemsAndSolutions": problems,
        "struggles": struggles,
        "keyAccomplishments": accomplishments,
        "nextUp": todo_items,
        "notes": [
            f"Spend: ${total_cost:.2f} ({total_tokens:,} tokens)",
            "Journal auto-generated by Maya.",
        ],
    }
    return entry


def generate_tomorrow_tasks(tasks: List[str]) -> List[str]:
    tomorrow_candidates = [task for task in tasks if "tomorrow" in task.lower() or "next" in task.lower()]
    if tomorrow_candidates:
        return tomorrow_candidates[:3]
    if len(tasks) > 3:
        return tasks[3:6]
    return ["No pre-commitments yet."]


def main() -> int:
    args = parse_args()

    now = parse_ts(args.now) if args.now else dt.datetime.now(dt.timezone.utc)
    window_start = now - dt.timedelta(hours=args.hours)

    files = sorted(glob.glob(args.sessions_glob))
    if not files:
        print("# OpenClaw Spend Report\n\nNo session logs found.")
        return 0

    assistant_turns = []
    tool_counts = Counter()
    session_totals = defaultdict(lambda: {"tokens": 0, "cost": 0.0, "assistant": 0, "tool_turns": 0})
    session_id_by_file = {}

    for fp in files:
        session_id = os.path.basename(fp).replace(".jsonl", "")
        session_id_by_file[fp] = session_id
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
                for content in msg.get("content") or []:
                    if (content or {}).get("type") == "toolCall":
                        name = (content or {}).get("name")
                        if name:
                            tools.append(name)
                tool_counts.update(tools)

                sid = session_id_by_file[fp]
                record = session_totals[sid]
                record["tokens"] += tokens
                record["cost"] += cost
                record["assistant"] += 1
                if tools:
                    record["tool_turns"] += 1

                assistant_turns.append((ts, tokens, cost, tuple(tools), sid))

    if not assistant_turns:
        print(f"# OpenClaw Spend Report\n\nNo assistant turns in the last {args.hours:g}h.")
        return 0

    assistant_turns.sort(key=lambda x: x[0])

    total_tokens = sum(turn[1] for turn in assistant_turns)
    total_cost = sum(turn[2] for turn in assistant_turns)
    count = len(assistant_turns)
    avg_tokens = total_tokens / max(count, 1)
    max_tokens = max(turn[1] for turn in assistant_turns)

    top_turns = sorted(assistant_turns, key=lambda x: x[1], reverse=True)[:5]

    per_session = sorted(
        ((sid, st["assistant"], st["tool_turns"], st["tokens"], st["cost"]) for sid, st in session_totals.items()),
        key=lambda x: x[3],
        reverse=True,
    )[:10]

    history_entries = load_jsonl(args.journal_history)
    signal_history = load_jsonl(args.signal_history)

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

    log_title, log_lines = read_last_log_block(args.coo_log)
    todo_tasks, completed_tasks = parse_todo_items(args.todo)

    journal_entry = build_journal_entry(
        now, args.hours, total_tokens, total_cost, log_title, log_lines, todo_tasks[:5]
    )

    signal_entry = build_signal_entry(
        now, now.date().isoformat(), total_tokens, log_lines, todo_tasks, signal_history
    )

    today_tasks = todo_tasks[:3] if todo_tasks else ["No high-leverage tasks defined."]
    tomorrow_tasks = generate_tomorrow_tasks(todo_tasks)
    blockers = collect_blockers(log_lines)

    previous_movement = find_previous_movement(history_entries)
    home_payload = build_home_payload(
        now.date().isoformat(),
        signal_entry,
        total_tokens,
        total_cost,
        cardified(today_tasks, "today"),
        cardified(tomorrow_tasks, "tomorrow"),
        {
            "date": previous_movement["date"],
            "movement": cardified(previous_movement["movement"], "movement"),
        },
        cardified(blockers, "blocker"),
    )

    print("# OpenClaw Spend Report")
    print("")
    print(
        f"Window: last {args.hours:g}h (UTC) — {window_start.isoformat(timespec='seconds')} → {now.isoformat(timespec='seconds')}"
    )
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
        print(
            f"- {ts.isoformat(timespec='seconds')} — {tokens:,} tokens — {money(cost)} — tools={tool_str} — session={sid}"
        )
    print("")

    print("## Per-session totals (top 10)")
    for sid, a_cnt, tool_cnt, tok, cost in per_session:
        print(f"- {sid}: turns={a_cnt}, tool-turns={tool_cnt}, tokens={tok:,}, cost={money(cost)}")

    if args.json_out:
        write_json(args.json_out, snapshot)

    if args.history_out:
        append_jsonl(args.history_out, snapshot)

    if args.journal_out:
        write_json(args.journal_out, journal_entry)
    if args.journal_history:
        append_jsonl(args.journal_history, journal_entry)

    if args.signal_out:
        write_json(args.signal_out, signal_entry)
    if args.signal_history:
        append_jsonl(args.signal_history, signal_entry)

    if args.home_out:
        write_json(args.home_out, home_payload)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
