"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface DocumentListItem {
  id: string;
  slug: string;
  doc_class: string;
  kind: string;
  title: string | null;
  locked: boolean;
  active_rule_count: number;
}

const CLASS_LABELS: Record<string, string> = {
  foundation: "Foundation",
  skill: "Skills",
};

function basename(slug: string): string {
  return slug.split("/").pop() ?? slug;
}

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const activeId = pathname.startsWith("/documents/") ? pathname.split("/")[2] : null;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/documents", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load (${res.status}).`);
        const data = await res.json();
        if (!active) return;
        setDocuments(data.documents ?? []);
        setError(null);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const groups = Array.from(new Set(documents.map((d) => d.doc_class)));

  return (
    <div className="flex h-screen">
      <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-gray-50/60">
        <div className="px-4 pt-5 pb-3">
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            ← All pieces
          </Link>
          <h2 className="mt-2 text-base font-semibold">Foundation</h2>
        </div>

        {error && <p className="px-4 text-sm text-red-600">{error}</p>}

        {groups.map((cls) => (
          <div key={cls} className="px-2 pb-4">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {CLASS_LABELS[cls] ?? cls}
            </p>
            <ul className="space-y-0.5">
              {documents
                .filter((d) => d.doc_class === cls)
                .map((d) => {
                  const isActive = d.id === activeId;
                  return (
                    <li key={d.id}>
                      <Link
                        href={`/documents/${d.id}`}
                        className={`block rounded-md px-2 py-1.5 ${
                          isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200/70"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {d.title || basename(d.slug)}
                          </span>
                          <span className="flex shrink-0 items-center gap-1">
                            {d.kind === "ruleset" && (
                              <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                  isActive ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {d.active_rule_count}
                              </span>
                            )}
                            {d.locked && (
                              <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                  isActive ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                locked
                              </span>
                            )}
                          </span>
                        </span>
                        <span
                          className={`block truncate font-mono text-[11px] ${
                            isActive ? "text-gray-300" : "text-gray-400"
                          }`}
                        >
                          {d.slug}
                        </span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </aside>

      <section className="flex-1 overflow-y-auto">{children}</section>
    </div>
  );
}
