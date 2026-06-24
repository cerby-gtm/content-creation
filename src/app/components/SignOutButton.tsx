"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
    >
      Sign out
    </button>
  );
}
