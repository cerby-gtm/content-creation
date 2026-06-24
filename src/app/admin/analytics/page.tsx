import Link from "next/link";
import { redirect } from "next/navigation";
import { getAnalytics } from "@/lib/analytics";
import { modelLabel } from "@/lib/models";
import { isAdminSession } from "@/lib/session";

export const runtime = "nodejs";
// Always reflect the latest data — never serve a cached snapshot of analytics.
export const dynamic = "force-dynamic";

const RANGES: { label: string; days: number | null }[] = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "All time", days: null },
];

function fmtInt(n: number): string {
  return n.toLocaleString("en-US");
}

function fmtUsd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function fmtDate(s: string): string {
  return new Date(s).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function truncate(s: string | null | undefined, n: number): string {
  if (!s) return "";
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">{title}</h2>
      {children}
    </section>
  );
}

const EDIT_TYPE_LABEL: Record<string, string> = {
  rewrite: "Highlight rewrite",
  quote_swap: "Quote swap",
  milestone_diff: "Publish diff",
  manual_rule: "Manual rule",
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  if (!(await isAdminSession())) {
    // Non-admins (incl. other @cerby.com users) never see analytics.
    redirect("/");
  }

  const { days: daysParam } = await searchParams;
  const days = daysParam === "all" ? null : Number(daysParam);
  const sinceDays = Number.isFinite(days) && days && days > 0 ? days : daysParam === "all" ? null : 30;

  const data = await getAnalytics(sinceDays);
  const { summary } = data;
  const totalTokens =
    summary.api.inputTokens +
    summary.api.outputTokens +
    summary.api.cacheReadTokens +
    summary.api.cacheWriteTokens;

  const activeRangeKey = sinceDays === null ? "all" : String(sinceDays);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Admin-only usage dashboard for Cerby Content OS.</p>
        </div>
        <Link href="/" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
          ← Back
        </Link>
      </div>

      {/* Range selector */}
      <div className="flex gap-2">
        {RANGES.map((r) => {
          const key = r.days === null ? "all" : String(r.days);
          const active = key === activeRangeKey;
          return (
            <Link
              key={key}
              href={`/admin/analytics?days=${key}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                active ? "bg-black text-white" : "border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {r.label}
            </Link>
          );
        })}
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Card
          label="Logins"
          value={fmtInt(summary.logins.total)}
          sub={`${fmtInt(summary.logins.uniqueUsers)} unique user${summary.logins.uniqueUsers === 1 ? "" : "s"}`}
        />
        <Card
          label="Content created"
          value={fmtInt(summary.pieces.total)}
          sub={`${fmtInt(summary.pieces.done)} completed`}
        />
        <Card label="Foundation changes" value={fmtInt(summary.foundationChanges)} sub="versioned edits" />
        <Card label="Feedback events" value={fmtInt(summary.feedback.total)} sub="highlight → instruction" />
        <Card
          label="Rules"
          value={fmtInt(summary.rules.active)}
          sub={`${fmtInt(summary.rules.proposed)} proposed · ${fmtInt(summary.rules.total)} total`}
        />
        <Card label="API calls" value={fmtInt(summary.api.calls)} sub="Anthropic passes" />
        <Card label="Tokens" value={fmtInt(totalTokens)} sub="input + output + cache" />
        <Card label="Est. API cost" value={fmtUsd(summary.api.estCostUsd)} sub="approximate" />
      </div>

      {/* Per-user activity */}
      <Section title="Activity by user">
        {data.byUser.length === 0 ? (
          <p className="text-sm text-gray-500">No activity in this range.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">User</th>
                  <th className="px-4 py-2 text-right font-medium">Logins</th>
                  <th className="px-4 py-2 text-right font-medium">Pieces</th>
                  <th className="px-4 py-2 text-right font-medium">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.byUser.map((u) => (
                  <tr key={u.email}>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtInt(u.logins)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtInt(u.pieces)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtInt(u.feedback)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* API usage by model */}
      <Section title="API usage by model">
        {data.byModel.length === 0 ? (
          <p className="text-sm text-gray-500">No API calls in this range.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Model</th>
                  <th className="px-4 py-2 text-right font-medium">Calls</th>
                  <th className="px-4 py-2 text-right font-medium">Input tok</th>
                  <th className="px-4 py-2 text-right font-medium">Output tok</th>
                  <th className="px-4 py-2 text-right font-medium">Est. cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.byModel.map((m) => (
                  <tr key={m.model}>
                    <td className="px-4 py-2">{m.label}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtInt(m.calls)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtInt(m.inputTokens)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtInt(m.outputTokens)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtUsd(m.estCostUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Recent feedback — the highlight → instruction log */}
      <Section title="Recent feedback & changes">
        {data.recentFeedback.length === 0 ? (
          <p className="text-sm text-gray-500">No feedback events in this range.</p>
        ) : (
          <ul className="space-y-2">
            {data.recentFeedback.map((f) => (
              <li key={f.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                    {EDIT_TYPE_LABEL[f.edit_type] ?? f.edit_type}
                  </span>
                  {f.lane && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                      {f.lane === "rule_candidate" ? "rule candidate" : "one-off"}
                    </span>
                  )}
                  <Link href={`/pieces/${f.piece_id}`} className="underline hover:text-gray-700">
                    piece
                  </Link>
                  <span>{f.created_by ?? "(unattributed)"}</span>
                  <span>· {fmtDate(f.created_at)}</span>
                </div>
                {f.instruction && (
                  <p className="mt-1 font-medium text-gray-900">“{truncate(f.instruction, 160)}”</p>
                )}
                {(f.before_text || f.after_text) && (
                  <p className="mt-1 text-xs text-gray-600">
                    {f.before_text && (
                      <span className="text-red-600 line-through">{truncate(f.before_text, 90)}</span>
                    )}
                    {f.before_text && f.after_text ? " → " : ""}
                    {f.after_text && <span className="text-green-700">{truncate(f.after_text, 90)}</span>}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Recent content */}
      <Section title="Recent content">
        {data.recentPieces.length === 0 ? (
          <p className="text-sm text-gray-500">No pieces in this range.</p>
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
            {data.recentPieces.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm hover:bg-gray-50">
                <Link href={`/pieces/${p.id}`} className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{p.title || "(untitled draft)"}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {p.content_type}
                    {p.model ? ` · ${modelLabel(p.model)}` : ""}
                    {" · "}
                    {p.created_by ?? "(unattributed)"}
                    {" · "}
                    {fmtDate(p.created_at)}
                  </span>
                </Link>
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Recent rules */}
      <Section title="Recent rules from feedback">
        {data.recentRules.length === 0 ? (
          <p className="text-sm text-gray-500">No rules in this range.</p>
        ) : (
          <ul className="space-y-2">
            {data.recentRules.map((r) => (
              <li key={r.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      r.status === "active"
                        ? "bg-green-100 text-green-800"
                        : r.status === "proposed"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.slug && <span className="font-mono">{r.slug}</span>}
                  {r.section && <span>· {r.section}</span>}
                  {r.approved_by && <span>· {r.approved_by}</span>}
                  <span>· {fmtDate(r.created_at)}</span>
                </div>
                <p className="mt-1 text-gray-900">{truncate(r.body, 200)}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Foundation changes */}
      <Section title="Recent foundation changes">
        {data.foundationChanges.length === 0 ? (
          <p className="text-sm text-gray-500">No foundation changes in this range.</p>
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
            {data.foundationChanges.map((c) => (
              <li key={c.id} className="px-4 py-2.5 text-sm">
                <span className="font-mono text-xs text-gray-500">{c.slug ?? "(deleted document)"}</span>
                <span className="ml-2">{truncate(c.reason, 120) || "edit"}</span>
                <span className="ml-2 text-xs text-gray-500">
                  {c.approved_by ? `· ${c.approved_by} ` : ""}· {fmtDate(c.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Recent logins */}
      <Section title="Recent logins">
        {data.recentLogins.length === 0 ? (
          <p className="text-sm text-gray-500">No logins in this range.</p>
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
            {data.recentLogins.map((l, i) => (
              <li key={`${l.email}-${i}`} className="flex justify-between px-4 py-2 text-sm">
                <span>
                  {l.name ? `${l.name} · ` : ""}
                  {l.email}
                </span>
                <span className="text-xs text-gray-500">{fmtDate(l.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  );
}
