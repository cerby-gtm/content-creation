import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export const metadata = {
  title: "Sign in · Cerby Content Creation",
};

export default async function LoginPage() {
  // Already signed in? Skip the login screen.
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f5f7] px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-10 py-14 text-center shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Cerby Content Creation
        </h1>
        <p className="mx-auto mt-4 max-w-xs text-base leading-relaxed text-gray-500">
          Cerby internal tool. Sign in with your @cerby.com Google account.
        </p>

        <form
          className="mt-10"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="mx-auto inline-flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
}
