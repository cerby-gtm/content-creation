import { pool, query, queryOne } from "./db";
import { removeRuleFromBody, spliceRuleIntoBody, updateRuleInBody } from "./rules";

// Admin data layer for the mutable foundation/skill documents (see
// LIVE-APP-DESIGN.md). The /documents UI reads and edits documents through here.
//
// `documents.body` is the authoritative rendered truth that generation reads, so
// every mutation below keeps it in sync and snapshots the prior body into
// `document_versions` (the undo button git used to provide). For ruleset
// documents, bullet operations also update the indexed `rules` rows so the
// overlap-check in classifyEdit stays accurate. Locked documents are never
// editable (mirrors approveProposedRule's check).

export interface DocumentListItem {
  id: string;
  slug: string;
  doc_class: string;
  kind: string;
  title: string | null;
  locked: boolean;
  display_order: number;
  updated_at: string;
  active_rule_count: number;
}

export interface RuleRow {
  id: string;
  section: string | null;
  body: string;
  status: string;
  display_order: number;
}

export interface DocumentDetail {
  id: string;
  slug: string;
  doc_class: string;
  kind: string;
  title: string | null;
  body: string;
  locked: boolean;
  updated_at: string;
  rules: RuleRow[]; // only populated for kind='ruleset'
}

export interface DocumentVersion {
  id: string;
  reason: string | null;
  approved_by: string | null;
  created_at: string;
}

export async function listDocuments(): Promise<DocumentListItem[]> {
  return query<DocumentListItem>(
    `SELECT d.id, d.slug, d.doc_class, d.kind, d.title, d.locked, d.display_order, d.updated_at,
            COALESCE(r.cnt, 0)::int AS active_rule_count
     FROM documents d
     LEFT JOIN (
       SELECT document_id, COUNT(*) AS cnt FROM rules WHERE status = 'active' GROUP BY document_id
     ) r ON r.document_id = d.id
     ORDER BY d.doc_class, d.display_order, d.slug`,
  );
}

export async function getDocument(id: string): Promise<DocumentDetail | null> {
  const doc = await queryOne<Omit<DocumentDetail, "rules">>(
    "SELECT id, slug, doc_class, kind, title, body, locked, updated_at FROM documents WHERE id = $1",
    [id],
  );
  if (!doc) return null;
  let rules: RuleRow[] = [];
  if (doc.kind === "ruleset") {
    rules = await query<RuleRow>(
      `SELECT id, section, body, status, display_order FROM rules
       WHERE document_id = $1 AND status = 'active'
       ORDER BY display_order, created_at`,
      [id],
    );
  }
  return { ...doc, rules };
}

export async function listVersions(id: string): Promise<DocumentVersion[]> {
  return query<DocumentVersion>(
    `SELECT id, reason, approved_by, created_at FROM document_versions
     WHERE document_id = $1 ORDER BY created_at DESC`,
    [id],
  );
}

// Locks-aware fetch used inside transactions. Throws on missing/locked.
async function lockDoc(
  client: import("pg").PoolClient,
  id: string,
): Promise<{ id: string; kind: string; body: string }> {
  const res = await client.query<{ id: string; kind: string; body: string; locked: boolean }>(
    "SELECT id, kind, body, locked FROM documents WHERE id = $1 FOR UPDATE",
    [id],
  );
  const doc = res.rows[0];
  if (!doc) throw new Error("Document not found.");
  if (doc.locked) throw new Error("Document is locked.");
  return { id: doc.id, kind: doc.kind, body: doc.body };
}

async function commitBody(
  client: import("pg").PoolClient,
  docId: string,
  beforeBody: string,
  afterBody: string,
  reason: string,
  approvedBy: string | null,
): Promise<void> {
  await client.query("UPDATE documents SET body = $1, updated_at = now() WHERE id = $2", [afterBody, docId]);
  await client.query(
    `INSERT INTO document_versions (document_id, before_body, after_body, reason, approved_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [docId, beforeBody, afterBody, reason, approvedBy],
  );
}

// Save the full body of a prose document. Ruleset bodies are managed through the
// rule operations below, not as a free-text blob, so this rejects them.
export async function saveBody(id: string, newBody: string, editedBy: string | null): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const doc = await lockDoc(client, id);
    if (doc.kind === "ruleset") {
      throw new Error("Ruleset documents are edited through their rules, not the raw body.");
    }
    await commitBody(client, id, doc.body, newBody, "admin edit", editedBy);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function addRule(
  id: string,
  section: string | null,
  text: string,
  editedBy: string | null,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const doc = await lockDoc(client, id);
    if (doc.kind !== "ruleset") throw new Error("Can only add rules to ruleset documents.");
    const orderRes = await client.query<{ next: number }>(
      "SELECT COALESCE(MAX(display_order), 0) + 1 AS next FROM rules WHERE document_id = $1",
      [id],
    );
    await client.query(
      `INSERT INTO rules (document_id, section, body, status, display_order, approved_by)
       VALUES ($1, $2, $3, 'active', $4, $5)`,
      [id, section, text, orderRes.rows[0].next, editedBy],
    );
    const newBody = spliceRuleIntoBody(doc.body, section, text);
    await commitBody(client, id, doc.body, newBody, "admin: add rule", editedBy);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function updateRule(
  ruleId: string,
  section: string | null,
  text: string,
  editedBy: string | null,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ruleRes = await client.query<{ document_id: string; body: string }>(
      "SELECT document_id, body FROM rules WHERE id = $1 FOR UPDATE",
      [ruleId],
    );
    const rule = ruleRes.rows[0];
    if (!rule) throw new Error("Rule not found.");
    const doc = await lockDoc(client, rule.document_id);
    await client.query(
      "UPDATE rules SET section = $1, body = $2, updated_at = now() WHERE id = $3",
      [section, text, ruleId],
    );
    const newBody = updateRuleInBody(doc.body, rule.body, text);
    await commitBody(client, doc.id, doc.body, newBody, "admin: edit rule", editedBy);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function retireRule(ruleId: string, editedBy: string | null): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ruleRes = await client.query<{ document_id: string; body: string }>(
      "SELECT document_id, body FROM rules WHERE id = $1 FOR UPDATE",
      [ruleId],
    );
    const rule = ruleRes.rows[0];
    if (!rule) throw new Error("Rule not found.");
    const doc = await lockDoc(client, rule.document_id);
    await client.query("UPDATE rules SET status = 'retired', updated_at = now() WHERE id = $1", [ruleId]);
    const newBody = removeRuleFromBody(doc.body, rule.body);
    await commitBody(client, doc.id, doc.body, newBody, "admin: retire rule", editedBy);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Restore the document body to the state captured in a prior version's
// after_body, recording the restore as a new version (so it is itself undoable).
export async function revertToVersion(
  id: string,
  versionId: string,
  editedBy: string | null,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const doc = await lockDoc(client, id);
    const verRes = await client.query<{ after_body: string | null; created_at: string }>(
      "SELECT after_body, created_at FROM document_versions WHERE id = $1 AND document_id = $2",
      [versionId, id],
    );
    const ver = verRes.rows[0];
    if (!ver) throw new Error("Version not found for this document.");
    if (ver.after_body === null) throw new Error("Version has no restorable body.");
    await commitBody(
      client,
      id,
      doc.body,
      ver.after_body,
      `revert to version from ${ver.created_at}`,
      editedBy,
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
