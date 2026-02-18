'use client';

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { DateTime } from "luxon";
import { CHICAGO_ZONE } from "@/lib/time";

type Signal = {
  openingLine: string;
  reflectionLine: string;
  feedback?: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  domain: string;
  status: string;
  priority: string;
  tags?: string | null;
  dueAt?: string | null;
  blocked: boolean;
};

type TaskBrief = {
  topThree: TaskRow[];
  nextThree: TaskRow[];
  doneToday: TaskRow[];
  bench: {
    open: number;
    doing: number;
    blocked: number;
    total: number;
  };
};

type UsageHour = { hour: number; totalCost: number; totalTokens: number };

type WeeklyDay = {
  day: string;
  totalCost: number | null;
  totalTokens: number | null;
  isCurrentWeek: boolean;
  isCompleted: boolean;
};

type WeeklyTrend = {
  label: string;
  isCurrentWeek: boolean;
  days: WeeklyDay[];
};

type UsageSummary = {
  yesterdayCost: number;
  yesterdayTokens: number;
  todayCost: number;
  todayTokens: number;
  todayByHour: UsageHour[];
  lastCompletedHour: number;
  weeklyTrend: WeeklyTrend[];
};

type DashboardShellProps = {};

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dueFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

const hourLabel = (hour: number) => `${hour.toString().padStart(2, "0")}:00`;

const SectionCard = ({ title, items }: { title: string; items: { id: string; title: string; detail: string }[] }) => {
  const display = items.length ? items : [{ id: "empty", title: "—", detail: "Nothing to report." }];
  return (
    <div className="directive-card">
      <h3>{title}</h3>
      <div className="directive-list">
        {display.map((card) => (
          <details key={card.id} className="directive-detail">
            <summary>{card.title}</summary>
            <p>{card.detail}</p>
          </details>
        ))}
      </div>
    </div>
  );
};

export default function DashboardShell({}: DashboardShellProps) {
  const [signal, setSignal] = useState<Signal | null>(null);
  const [brief, setBrief] = useState<TaskBrief | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", domain: "SANCTUM", priority: "P2", dueAt: "", tags: "" });

  const fetchJson = useCallback(async <T,>(route: string): Promise<T | null> => {
    try {
      const res = await fetch(route, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch (error) {
      console.error("fetch error", error);
      return null;
    }
  }, []);

  const refreshSignal = useCallback(async () => {
    const data = await fetchJson<Signal>("/api/daily-signal/today");
    setSignal(data);
  }, [fetchJson]);

  const refreshBrief = useCallback(async () => {
    const data = await fetchJson<TaskBrief>("/api/tasks/brief");
    setBrief(data);
  }, [fetchJson]);

  const refreshUsage = useCallback(async () => {
    const data = await fetchJson<UsageSummary>("/api/usage/summary");
    setUsage(data);
  }, [fetchJson]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshSignal(), refreshBrief(), refreshUsage()]);
  }, [refreshSignal, refreshBrief, refreshUsage]);

  useEffect(() => {
    refreshAll();
    const handler = () => setModalOpen(true);
    window.addEventListener("sanctum-open-add-task", handler);
    return () => window.removeEventListener("sanctum-open-add-task", handler);
  }, [refreshAll]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!modalOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      title: form.title,
      domain: form.domain,
      priority: form.priority,
      dueAt: form.dueAt || undefined,
      tags: form.tags || undefined,
    };

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setToast("Task added");
      setModalOpen(false);
      setForm({ title: "", domain: "SANCTUM", priority: "P2", dueAt: "", tags: "" });
      refreshBrief();
    }
  };

  const topThree = brief?.topThree ?? [];
  const nextThree = brief?.nextThree ?? [];
  const doneToday = brief?.doneToday ?? [];

  const taskCards = (items: TaskRow[]) =>
    items.map((task) => {
      const extras = [task.domain, task.priority];
      if (task.tags) extras.push(task.tags);
      if (task.dueAt) extras.push(`due ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(task.dueAt))}`);
      if (task.blocked) extras.push("blocked");
      return { id: task.id, title: task.title, detail: extras.join(" · ") };
    });

  const completedHours = usage?.lastCompletedHour ?? -1;
  const weeklyTrend = usage?.weeklyTrend ?? [];
  const latestTrendCost = weeklyTrend.at(-1)?.days.at(-1)?.totalCost ?? 0;
  const tokensToday = usage?.todayTokens ?? 0;
  const costToday = usage?.todayCost ?? 0;
  const dayLabel = DateTime.now().setZone(CHICAGO_ZONE).toFormat("EEE, MMM d, yyyy");
  const dayRangeText = completedHours >= 0 ? `00:00 – ${hourLabel(completedHours)}` : "No completed hours yet";

  return (
    <div className="dashboard-shell">
      <section className="signal-panel">
        {signal ? (
          <>
            <p className="signal-humor">{signal.openingLine}</p>
            <p className="signal-reflection">{signal.reflectionLine}</p>
          </>
        ) : (
          <p className="signal-humor subtle">Signal awaiting the ritual.</p>
        )}
      </section>

      <section className="command-board">
        <div className="command-columns">
          <SectionCard title="TODAY (Max 3)" items={taskCards(topThree)} />
          <SectionCard title="YESTERDAY" items={taskCards(doneToday)} />
          <SectionCard title="NEXT" items={taskCards(nextThree)} />
        </div>
      </section>

      <div className="task-link-wrap">
        <Link href="/productivity" className="all-tasks-link">
          Go to All Tasks →
        </Link>
      </div>

      <section className="summary usage-summary">
        <div>
          <p className="section-label">SUMMARY</p>
          <p>
            Yesterday cost: <strong>{currencyFormatter.format(usage?.yesterdayCost ?? 0)}</strong>
          </p>
          <p>
            Today cost: <strong>{currencyFormatter.format(usage?.todayCost ?? 0)}</strong>
          </p>
          <p className="subtle">Tokens today: {usage?.todayTokens?.toLocaleString() ?? 0}</p>
        </div>
        <div className="plan-note">
          <p>Ritual Command Surface</p>
          {weeklyTrend.length > 0 && (
            <p className="subtle">
              7-day trend: {currencyFormatter.format(latestTrendCost)}
            </p>
          )}
        </div>
      </section>

      <section className="usage-detail">
        <div className="day-summary-card">
          <p className="day-summary-label">CST Day Summary</p>
          <p className="day-summary-date">{dayLabel}</p>
          <p className="day-summary-range">{dayRangeText}</p>
          <div className="day-summary-stats">
            <div>
              <p>Total tokens</p>
              <strong>{tokensToday.toLocaleString()}</strong>
            </div>
            <div>
              <p>Total cost</p>
              <strong>{currencyFormatter.format(costToday)}</strong>
            </div>
          </div>
        </div>
        <div className="line-chart">
          <div className="line-chart-header">
            <p className="section-label">Weekly Trend (Sun → Sat)</p>
            <span className="subtle">Current week shows completed days only</span>
          </div>
          <div className="line-chart-rows">
            {weeklyTrend.map((week) => (
              <div className={`line-row${week.isCurrentWeek ? " current" : ""}`} key={week.label}>
                <div className="row-label">
                  {week.isCurrentWeek ? "Current week" : week.label}
                  {week.isCurrentWeek && <span className="current-week">Current</span>}
                </div>
                <div className="row-points">
                  {week.days.map((day) => (
                    <div
                      key={`${week.label}-${day.day}`}
                      className={`row-point${day.totalCost === null ? " empty" : ""}`}
                    >
                      <span className="row-day">{day.day}</span>
                      <span className="row-value">
                        {day.totalCost !== null ? currencyFormatter.format(day.totalCost) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>Add Task</h3>
            <form onSubmit={handleSubmit} className="modal-form">
              <label>
                Title
                <input
                  autoFocus
                  required
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </label>
              <label>
                Domain
                <select value={form.domain} onChange={(event) => setForm((prev) => ({ ...prev, domain: event.target.value }))}>
                  <option value="SANCTUM">SANCTUM</option>
                  <option value="REAL_ESTATE">REAL_ESTATE</option>
                  <option value="FREEDOM">FREEDOM</option>
                  <option value="PERSONAL">PERSONAL</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </label>
              <label>
                Priority
                <select value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}>
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                  <option value="P3">P3</option>
                </select>
              </label>
              <label>
                Due date (optional)
                <input type="date" value={form.dueAt} onChange={(event) => setForm((prev) => ({ ...prev, dueAt: event.target.value }))} />
              </label>
              <label>
                Tags (comma separated)
                <input value={form.tags} onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))} />
              </label>
              <div className="modal-actions">
                <button type="submit">Create</button>
                <button type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
