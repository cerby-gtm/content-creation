import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { query } from "@/lib/db";

// The full server-side auth instance used by the API route handlers and server
// components. It extends the edge-safe authConfig (providers, callbacks, pages)
// with a Node-only `events.signIn` that records each sign-in to Postgres — the
// only place login activity is persisted (the app uses stateless JWT sessions
// with no database adapter). This module is never imported by the edge
// middleware, so the `pg`-backed query() import here is safe.

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  events: {
    // Fires on every fresh sign-in. Best-effort: a logging failure must never
    // block the user from authenticating.
    async signIn({ user }) {
      if (!user?.email) return;
      try {
        await query(
          "INSERT INTO auth_events (email, name, event_type) VALUES ($1, $2, 'login')",
          [user.email, user.name ?? null],
        );
      } catch (err) {
        console.error("auth_events login insert failed:", err);
      }
    },
  },
});
