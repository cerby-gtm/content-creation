// Admin gate for the analytics dashboard. The app's middleware already limits
// access to @cerby.com Workspace accounts; this narrows the admin surface
// (/admin/*) to a specific allowlist. Defaults to the app owner and is
// overridable via the ADMIN_EMAILS env var (comma-separated) without a redeploy.
//
// Pure (no auth/db imports) so it is safe to call from anywhere server-side.

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "andy.binkley@cerby.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdmin(email: string | null | undefined): boolean {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}
