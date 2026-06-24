import { query } from "./db";
import { estimateCostUsd, modelLabel } from "./models";

// Aggregation queries for the admin analytics dashboard (/admin/analytics).
// Everything here reads from tables the app already writes to as a side effect
// of normal use — pieces, feedback_events, rules, document_versions — plus the
// two analytics-only tables (auth_events for logins, model_calls for API usage).
// There is no separate event-logging layer to drift out of sync.

export interface AnalyticsSummary {
  logins: { total: number; uniqueUsers: number };
  pieces: { total: number; done: number };
  foundationChanges: number;
  feedback: { total: number; byType: { edit_type: string; count: number }[] };
  rules: { proposed: number; active: number; total: number };
  api: {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    estCostUsd: number;
  };
}

export interface LoginRow {
  email: string;
  name: string | null;
  created_at: string;
}

export interface PieceRow {
  id: string;
  title: string | null;
  content_type: string;
  status: string;
  model: string | null;
  created_by: string | null;
  created_at: string;
}

export interface FeedbackRow {
  id: string;
  piece_id: string;
  edit_type: string;
  instruction: string | null;
  selected_text: string;
  before_text: string;
  after_text: string;
  lane: string | null;
  created_by: string | null;
  created_at: string;
}

export interface RuleRow {
  id: string;
  body: string;
  section: string | null;
  status: string;
  slug: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface FoundationChangeRow {
  id: string;
  slug: string | null;
  title: string | null;
  reason: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface UserActivityRow {
  email: string;
  logins: number;
  pieces: number;
  feedback: number;
}

export interface ModelUsageRow {
  model: string;
  label: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  estCostUsd: number;
}

export interface AnalyticsData {
  sinceDays: number | null;
  summary: AnalyticsSummary;
  recentLogins: LoginRow[];
  recentPieces: PieceRow[];
  recentFeedback: FeedbackRow[];
  recentRules: RuleRow[];
  foundationChanges: FoundationChangeRow[];
  byUser: UserActivityRow[];
  byModel: ModelUsageRow[];
}

// Builds a "created_at >= now() - interval 'N days'" clause, or empty for
// all-time. days is an integer we control (from a fixed allowlist), so it is
// safe to interpolate; we still parameterize nothing user-supplied.
function sinceClause(days: number | null, column = "created_at"): string {
  if (!days) return "";
  return `WHERE ${column} >= now() - interval '${Math.trunc(days)} days'`;
}

const num = (v: unknown) => Number(v ?? 0);

export async function getAnalytics(sinceDays: number | null = null): Promise<AnalyticsData> {
  const where = sinceClause(sinceDays);

  const [
    loginAgg,
    pieceAgg,
    foundationAgg,
    feedbackAgg,
    feedbackByType,
    ruleAgg,
    apiAgg,
    apiByModel,
    recentLogins,
    recentPieces,
    recentFeedback,
    recentRules,
    foundationChanges,
    byUser,
  ] = await Promise.all([
    query<{ total: string; users: string }>(
      `SELECT COUNT(*) AS total, COUNT(DISTINCT email) AS users FROM auth_events ${where}`,
    ),
    query<{ total: string; done: string }>(
      `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'done') AS done FROM pieces ${where}`,
    ),
    query<{ total: string }>(`SELECT COUNT(*) AS total FROM document_versions ${where}`),
    query<{ total: string }>(`SELECT COUNT(*) AS total FROM feedback_events ${where}`),
    query<{ edit_type: string; count: string }>(
      `SELECT edit_type, COUNT(*) AS count FROM feedback_events ${where} GROUP BY edit_type ORDER BY count DESC`,
    ),
    query<{ proposed: string; active: string; total: string }>(
      `SELECT COUNT(*) FILTER (WHERE status = 'proposed') AS proposed,
              COUNT(*) FILTER (WHERE status = 'active') AS active,
              COUNT(*) AS total
       FROM rules ${where}`,
    ),
    query<{
      calls: string;
      input: string;
      output: string;
      cache_read: string;
      cache_write: string;
    }>(
      `SELECT COUNT(*) AS calls,
              COALESCE(SUM(input_tokens),0) AS input,
              COALESCE(SUM(output_tokens),0) AS output,
              COALESCE(SUM(cache_read_tokens),0) AS cache_read,
              COALESCE(SUM(cache_write_tokens),0) AS cache_write
       FROM model_calls ${where}`,
    ),
    query<{
      model: string;
      calls: string;
      input: string;
      output: string;
      cache_read: string;
      cache_write: string;
    }>(
      `SELECT model, COUNT(*) AS calls,
              COALESCE(SUM(input_tokens),0) AS input,
              COALESCE(SUM(output_tokens),0) AS output,
              COALESCE(SUM(cache_read_tokens),0) AS cache_read,
              COALESCE(SUM(cache_write_tokens),0) AS cache_write
       FROM model_calls ${where}
       GROUP BY model ORDER BY calls DESC`,
    ),
    query<LoginRow>(
      `SELECT email, name, created_at FROM auth_events ${where} ORDER BY created_at DESC LIMIT 25`,
    ),
    query<PieceRow>(
      `SELECT id, title, content_type, status, model, created_by, created_at
       FROM pieces ${where} ORDER BY created_at DESC LIMIT 25`,
    ),
    query<FeedbackRow>(
      `SELECT id, piece_id, edit_type, instruction, selected_text, before_text, after_text,
              lane, created_by, created_at
       FROM feedback_events ${where} ORDER BY created_at DESC LIMIT 50`,
    ),
    query<RuleRow>(
      `SELECT r.id, r.body, r.section, r.status, d.slug, r.approved_by, r.created_at
       FROM rules r LEFT JOIN documents d ON d.id = r.document_id
       ${sinceClause(sinceDays, "r.created_at")}
       ORDER BY r.created_at DESC LIMIT 25`,
    ),
    query<FoundationChangeRow>(
      `SELECT v.id, d.slug, d.title, v.reason, v.approved_by, v.created_at
       FROM document_versions v LEFT JOIN documents d ON d.id = v.document_id
       ${sinceClause(sinceDays, "v.created_at")}
       ORDER BY v.created_at DESC LIMIT 25`,
    ),
    // Per-user activity: union the actor column from each table, count by source.
    query<{ email: string; logins: string; pieces: string; feedback: string }>(
      `WITH actors AS (
         SELECT email AS email, 'login' AS kind FROM auth_events ${where}
         UNION ALL
         SELECT created_by AS email, 'piece' AS kind FROM pieces ${where}
         UNION ALL
         SELECT created_by AS email, 'feedback' AS kind FROM feedback_events ${where}
       )
       SELECT COALESCE(email, '(unattributed)') AS email,
              COUNT(*) FILTER (WHERE kind = 'login') AS logins,
              COUNT(*) FILTER (WHERE kind = 'piece') AS pieces,
              COUNT(*) FILTER (WHERE kind = 'feedback') AS feedback
       FROM actors
       GROUP BY COALESCE(email, '(unattributed)')
       ORDER BY logins DESC, pieces DESC`,
    ),
  ]);

  const byModel: ModelUsageRow[] = apiByModel.map((r) => ({
    model: r.model,
    label: modelLabel(r.model),
    calls: num(r.calls),
    inputTokens: num(r.input),
    outputTokens: num(r.output),
    estCostUsd: estimateCostUsd(
      r.model,
      num(r.input),
      num(r.output),
      num(r.cache_read),
      num(r.cache_write),
    ),
  }));

  const a = apiAgg[0];
  const estCostUsd = byModel.reduce((sum, m) => sum + m.estCostUsd, 0);

  return {
    sinceDays,
    summary: {
      logins: { total: num(loginAgg[0]?.total), uniqueUsers: num(loginAgg[0]?.users) },
      pieces: { total: num(pieceAgg[0]?.total), done: num(pieceAgg[0]?.done) },
      foundationChanges: num(foundationAgg[0]?.total),
      feedback: {
        total: num(feedbackAgg[0]?.total),
        byType: feedbackByType.map((r) => ({ edit_type: r.edit_type, count: num(r.count) })),
      },
      rules: {
        proposed: num(ruleAgg[0]?.proposed),
        active: num(ruleAgg[0]?.active),
        total: num(ruleAgg[0]?.total),
      },
      api: {
        calls: num(a?.calls),
        inputTokens: num(a?.input),
        outputTokens: num(a?.output),
        cacheReadTokens: num(a?.cache_read),
        cacheWriteTokens: num(a?.cache_write),
        estCostUsd,
      },
    },
    recentLogins,
    recentPieces,
    recentFeedback,
    recentRules,
    foundationChanges,
    byUser: byUser.map((r) => ({
      email: r.email,
      logins: num(r.logins),
      pieces: num(r.pieces),
      feedback: num(r.feedback),
    })),
    byModel,
  };
}
