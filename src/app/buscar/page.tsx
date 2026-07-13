"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ContentCard } from "@/components/ContentCard";
import type { ContentResult } from "@/lib/content/types";

function Buscador() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [results, setResults] = useState<ContentResult[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function run(query: string) {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setFailed(data.failedSources ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = params.get("q");
    if (initial) run(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="container">
      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault();
          run(q);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar material educativo…"
        />
        <button type="submit">Buscar</button>
      </form>

      {loading && <p className="muted">Buscando…</p>}
      {failed.length > 0 && (
        <p className="warn">Algunas fuentes no respondieron: {failed.join(", ")}</p>
      )}
      {!loading && searched && results.length === 0 && (
        <p className="muted">Sin resultados. Probá con otros términos.</p>
      )}

      <div className="grid">
        {results.map((r) => (
          <ContentCard key={r.id} item={r} />
        ))}
      </div>
    </main>
  );
}

export default function BuscarPage() {
  return (
    <Suspense>
      <Buscador />
    </Suspense>
  );
}
