import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// The single Workspace domain allowed to sign in. Defense-in-depth: the OAuth
// consent screen should be set to "Internal" in Google Cloud (so only cerby.com
// Workspace users can authenticate at all), the `hd` param hints the domain to
// Google, and the signIn callback below hard-rejects anything not @cerby.com.
const ALLOWED_DOMAIN = "cerby.com";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Railway (and any non-Vercel host) needs to trust the proxy host header.
  trustHost: true,
  providers: [
    Google({
      authorization: {
        params: {
          // Restrict the Google account chooser to the Cerby Workspace and
          // always show the chooser so a wrong personal account isn't silently reused.
          hd: ALLOWED_DOMAIN,
          prompt: "select_account",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Final gate: only verified @cerby.com Workspace accounts get in.
    signIn({ profile }) {
      return Boolean(
        profile?.email_verified &&
          profile.hd === ALLOWED_DOMAIN &&
          profile.email?.endsWith(`@${ALLOWED_DOMAIN}`),
      );
    },
    // `authorized` is consulted by the middleware export below.
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
  },
});
