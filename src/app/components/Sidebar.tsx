"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Shared left sidebar for the two content modes. A segmented toggle at the top
// switches the main body between Content Creation (/) and Content Repurpose
// (/repurpose); the nav links below (Proposed rules, Foundation files,
// Analytics) are shared and stay visible in both modes. Only the main body and
// the "New" action differ per mode — those live in each mode's page.
export type Mode = "create" | "repurpose";

export default function Sidebar({ mode }: { mode: Mode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setIsAdmin(Boolean(d?.isAdmin)))
      .catch(() => {});
  }, []);

  const segBase =
    "flex-1 rounded px-2.5 py-1.5 text-center text-xs font-medium transition-colors";
  const segActive = "bg-black text-white";
  const segIdle = "text-gray-600 hover:bg-gray-100";

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 overflow-y-auto border-r border-gray-200 bg-gray-50 px-4 py-6 lg:block">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Cerby Content OS
      </h2>

      <div className="mt-4 flex gap-1 rounded-md border border-gray-300 bg-white p-0.5">
        <Link href="/" className={`${segBase} ${mode === "create" ? segActive : segIdle}`}>
          Content Creation
        </Link>
        <Link
          href="/repurpose"
          className={`${segBase} ${mode === "repurpose" ? segActive : segIdle}`}
        >
          Content Repurpose
        </Link>
      </div>

      <nav className="mt-5 space-y-1">
        <Link
          href="/review"
          className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Proposed rules
        </Link>
        <Link
          href="/documents"
          className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Foundation files
        </Link>
        {isAdmin && (
          <Link
            href="/admin/analytics"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Analytics
          </Link>
        )}
      </nav>
    </aside>
  );
}
