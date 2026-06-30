import { useEffect, useState } from "react";
import { fetchAdminOverview, type AdminOverview } from "../lib/api.js";
import { navigate } from "../lib/router.js";

function compact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="font-mono text-[0.58rem] uppercase tracking-wider text-white/40">
        {label}
      </div>
      <div className="mt-1.5 font-display text-3xl text-white">{value}</div>
      {sub && <div className="mt-0.5 text-[0.72rem] text-accent/70">{sub}</div>}
    </div>
  );
}

export default function Admin() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [state, setState] = useState<"loading" | "forbidden" | "error" | "ok">(
    "loading",
  );

  useEffect(() => {
    fetchAdminOverview()
      .then((d) => {
        setData(d);
        setState("ok");
      })
      .catch((e) => {
        setState((e as Error).message === "FORBIDDEN" ? "forbidden" : "error");
      });
  }, []);

  if (state === "loading") return null;
  if (state === "forbidden") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-accent/80">
          403
        </div>
        <p className="text-white/60">This page is for platform admins.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-lg border border-white/12 bg-white/[0.03] px-4 py-2 text-sm text-white/70 hover:border-accent/40"
        >
          Back to dashboard
        </button>
      </div>
    );
  }
  if (state === "error" || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/50">
        Could not load admin overview.
      </div>
    );
  }

  const peak = Math.max(1, ...data.perDay.map((d) => d.tokens));

  return (
    <div className="relative min-h-screen">
      <div className="bg-atmosphere" aria-hidden />
      <div className="relative z-10 mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between border-b border-white/[0.06] pb-5">
          <div>
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent/80">
              Platform admin
            </div>
            <h1 className="mt-1 font-display text-2xl text-white">Insights</h1>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-white/40 hover:text-accent"
          >
            ← Dashboard
          </button>
        </header>

        {/* Headline metrics */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric
            label="Users"
            value={String(data.users)}
            sub={data.newUsers7 ? `+${data.newUsers7} this week` : undefined}
          />
          <Metric
            label="Bots"
            value={String(data.bots)}
            sub={`${data.botsPublished} published`}
          />
          <Metric label="Chats (all-time)" value={compact(data.chatsAll)} />
          <Metric label="Tokens (all-time)" value={compact(data.tokensAll)} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Chats today" value={String(data.chatsToday)} />
          <Metric label="Tokens today" value={compact(data.tokensToday)} />
          <Metric label="Tokens 7d" value={compact(data.tokens7)} />
          <Metric label="Tokens 30d" value={compact(data.tokens30)} />
        </div>

        {/* 30-day trend */}
        <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="font-display text-lg text-white">Tokens - last 30 days</h2>
          {data.perDay.length === 0 ? (
            <p className="mt-2 text-sm text-white/40">No usage recorded yet.</p>
          ) : (
            <div className="mt-3 flex h-28 items-end gap-1">
              {data.perDay.map((d) => (
                <div
                  key={d.day}
                  title={`${d.day}: ${d.tokens.toLocaleString()} tokens · ${d.requests} chats`}
                  className="flex-1 rounded-t bg-accent/40 transition-colors hover:bg-accent/70"
                  style={{ height: `${Math.max(3, (d.tokens / peak) * 100)}%` }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Top bots */}
        <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="font-display text-lg text-white">Top agents by usage</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.06]">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] font-mono text-[0.58rem] uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-3 py-2">Agent</th>
                  <th className="px-3 py-2">Handle</th>
                  <th className="px-3 py-2 text-right">Chats</th>
                  <th className="px-3 py-2 text-right">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {data.topBots.map((b, i) => (
                  <tr key={i} className="border-t border-white/[0.05]">
                    <td className="px-3 py-2 text-white/80">{b.subjectName || "-"}</td>
                    <td className="px-3 py-2 font-mono text-white/50">
                      {b.handle ? `/u/${b.handle}` : <span className="text-white/25">draft</span>}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-white/70">
                      {b.requests.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-white/70">
                      {b.tokens.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {data.topBots.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-white/40">
                      No agents yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent signups */}
        <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="font-display text-lg text-white">Recent signups</h2>
          <ul className="mt-3 divide-y divide-white/[0.05]">
            {data.recentUsers.map((u, i) => (
              <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-white/80">{u.name || "(no name)"}</span>
                <span className="font-mono text-white/40">{u.email ?? "-"}</span>
                <span className="font-mono text-[0.72rem] text-white/30">{u.createdAt}</span>
              </li>
            ))}
            {data.recentUsers.length === 0 && (
              <li className="py-3 text-center text-white/40">No users yet.</li>
            )}
          </ul>
        </section>

        <div className="h-16" />
      </div>
    </div>
  );
}
