import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "https://www.federalregister.gov/api/v1/documents.json";

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}

export default function App() {
  const [docs, setDocs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  // Filters
  const [q, setQ] = useState("");
  const [agency, setAgency] = useState("");
  const [docType, setDocType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Bookmarks — store document numbers (unique IDs)
  const [bookmarks, setBookmarks] = useLocalStorage("regx_bookmarks", []);

  const isBookmarked = (docNumber) => bookmarks.includes(docNumber);
  const toggleBookmark = (docNumber) => {
    setBookmarks((prev) => {
      if (prev.includes(docNumber)) return prev.filter((n) => n !== docNumber);
      return [...prev, docNumber];
    });
  };

  // Build API params
  const buildUrl = (nextPage = 1) => {
    const url = new URL(API_BASE);
    url.searchParams.set("per_page", "20");
    url.searchParams.set("order", "newest");
    url.searchParams.set("page", String(nextPage));
    if (q.trim()) url.searchParams.set("conditions[term]", q.trim());
    // Agency & type are filtered client-side (still useful to keep server query simple & fast)
    return url.toString();
  };

  const fetchDocs = async (reset = true) => {
    setLoading(true);
    setError("");
    try {
      const nextPage = reset ? 1 : page + 1;
      const res = await fetch(buildUrl(nextPage));
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      const items = data?.results ?? [];
      setHasMore(Boolean(items.length));
      setPage(nextPage);
      setDocs((prev) => (reset ? items : [...prev, ...items]));
      if (reset) setSelected(null);
    } catch (e) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDocs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter docs client-side
  const filtered = useMemo(() => {
    return docs.filter((d) => {
      // Agency filter
      if (agency) {
        const names = (d.agencies || []).map((a) => a.name);
        if (!names.includes(agency)) return false;
      }
      // Doc type
      if (docType && d.document_type !== docType) return false;
      // Date range
      const pub = d.publication_date; // YYYY-MM-DD
      if (startDate && pub < startDate) return false;
      if (endDate && pub > endDate) return false;
      return true;
    });
  }, [docs, agency, docType, startDate, endDate]);

  // Build dynamic filter options
  const agencyOptions = useMemo(() => {
    const set = new Set();
    docs.forEach((d) => (d.agencies || []).forEach((a) => set.add(a.name)));
    return Array.from(set).sort();
  }, [docs]);

  const typeOptions = useMemo(() => {
    const set = new Set(docs.map((d) => d.document_type).filter(Boolean));
    return Array.from(set).sort();
  }, [docs]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Regulatory Document Explorer</h1>
            <p className="text-sm text-slate-600">Federal Register • No AI • Demo</p>
          </div>
          <div className="flex gap-2 flex-wrap items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-medium text-slate-600 mb-1">Keyword</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
                placeholder="e.g., cryptocurrency, environment, banking"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div>
              <button
                onClick={() => fetchDocs(true)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Searching…" : "Search"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters */}
        <section className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 h-max sticky top-[92px]">
          <h2 className="text-lg font-semibold mb-3">Filters</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Agency</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
              >
                <option value="">All</option>
                {agencyOptions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Document Type</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option value="">All</option>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={() => { setAgency(""); setDocType(""); setStartDate(""); setEndDate(""); }}
              className="text-xs text-slate-600 hover:underline"
            >
              Reset filters
            </button>
          </div>
        </section>

        {/* List + Details */}
        <section className="lg:col-span-2 space-y-4">
          {/* Loading / Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">{error}</div>
          )}

          {/* Results grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((d) => (
              <article
                key={d.document_number}
                className={`bg-white border ${selected?.document_number===d.document_number?"border-indigo-400":"border-slate-200"} rounded-2xl shadow-sm p-4 flex flex-col`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold leading-snug line-clamp-2">{d.title}</h3>
                  <button
                    onClick={() => toggleBookmark(d.document_number)}
                    className={`text-xs rounded-full px-2 py-1 border ${isBookmarked(d.document_number)?"bg-amber-100 border-amber-300":"bg-white border-slate-300"}`}
                    title={isBookmarked(d.document_number)?"Remove bookmark":"Bookmark"}
                  >
                    {isBookmarked(d.document_number) ? "★" : "☆"}
                  </button>
                </div>
                <p className="text-sm text-slate-600 mt-2 line-clamp-3">{d.abstract || "No summary available."}</p>
                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <div><span className="font-medium">Date:</span> {formatDate(d.publication_date)}</div>
                  <div><span className="font-medium">Type:</span> {d.document_type || "—"}</div>
                  <div className="truncate"><span className="font-medium">Agencies:</span> {(d.agencies||[]).map(a=>a.name).join(", ") || "—"}</div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs hover:bg-black"
                    onClick={() => setSelected(d)}
                  >
                    View Details
                  </button>
                  <a
                    href={d.html_url}
                    target="_blank" rel="noreferrer"
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs hover:bg-slate-50"
                  >
                    Open Source
                  </a>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing {filtered.length} of {docs.length} loaded
              {q && <span> for "{q}"</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchDocs(false)}
                disabled={loading || !hasMore}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Loading…" : hasMore ? "Load More" : "No More"}
              </button>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-50"
              >
                Back to Top
              </button>
            </div>
          </div>

          {/* Bookmarks */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h2 className="text-lg font-semibold mb-2">Bookmarks ({bookmarks.length})</h2>
            {bookmarks.length === 0 && (
              <p className="text-sm text-slate-600">No bookmarks yet. Click ☆ on a card to save it here.</p>
            )}
            <div className="flex gap-2 flex-wrap">
              {bookmarks.map((b) => {
                const d = docs.find((x) => x.document_number === b);
                if (!d) return null;
                return (
                  <button
                    key={b}
                    onClick={() => setSelected(d)}
                    className="text-xs px-3 py-2 rounded-full border border-slate-300 hover:bg-slate-50"
                    title="Open details"
                  >
                    {d.title.slice(0, 40)}{d.title.length > 40 ? "…" : ""}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Detail Drawer */}
          {selected && (
            <div className="fixed inset-0 z-20 flex">
              <div className="flex-1 bg-black/30" onClick={() => setSelected(null)} />
              <aside className="w-full max-w-xl h-full overflow-y-auto bg-white border-l border-slate-200 p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-semibold leading-tight">{selected.title}</h3>
                  <button
                    onClick={() => setSelected(null)}
                    className="px-3 py-1 rounded-lg border border-slate-300 text-sm hover:bg-slate-50"
                  >Close</button>
                </div>
                <div className="mt-2 text-sm text-slate-600">{formatDate(selected.publication_date)} • {selected.document_type || "—"}</div>
                <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{selected.abstract || "No summary provided."}</div>
                <dl className="mt-4 text-sm">
                  <dt className="font-medium text-slate-700">Agencies</dt>
                  <dd className="text-slate-600">{(selected.agencies||[]).map(a=>a.name).join(", ") || "—"}</dd>
                  <dt className="font-medium text-slate-700 mt-3">CFR References</dt>
                  <dd className="text-slate-600">{(selected.citation || "—")}</dd>
                  <dt className="font-medium text-slate-700 mt-3">Document #</dt>
                  <dd className="text-slate-600">{selected.document_number}</dd>
                </dl>
                <div className="mt-4 flex gap-2">
                  <a href={selected.html_url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-black">Open on Federal Register</a>
                  <button
                    onClick={() => toggleBookmark(selected.document_number)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-50"
                  >
                    {isBookmarked(selected.document_number) ? "Remove Bookmark" : "Bookmark"}
                  </button>
                </div>
              </aside>
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-xs text-slate-500">
        Built for the Otonoco AI Challenge — Base UI only (no AI features). Data: Federal Register API.
      </footer>
    </div>
  );
}
