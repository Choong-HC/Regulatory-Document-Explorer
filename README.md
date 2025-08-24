# Regulatory-Document-Explorer
A minimal, no‑backend, React + Vite + Tailwind v4 app that fetches recent U.S. federal regulatory documents from the Federal Register API and provides a simple discovery UI: search, filter, detail view, bookmarks, loading/error states, and pagination.

This submission intentionally excludes AI features (per prompt). The README documents how AI would be integrated in a follow‑up version.

# ✨ Features Implemented

Fetch recent documents (title, date, type, agencies)

Keyword search (server‑side via API term)

Client‑side filters: agency, document type, date range

Detail drawer with external link to the source

Local bookmarks (persisted in localStorage)

Loading & error states, “Load more” pagination

Responsive layout (Tailwind v4)

# 🧱 Tech Stack

React 18 + Vite (fast dev/build)

Tailwind CSS v4 (utility‑first styling)

Federal Register API (public; no API key)

# 🚀 Getting Started

Prerequisites

Node.js 18+ (node -v)

Install & Run (dev)
# install dependencies
npm install


# start dev server
npm run dev

Open the printed URL (usually http://localhost:5173).

Build & Preview (prod)
npm run build
npm run preview
Tailwind v4 Notes

This project uses Tailwind v4 (new PostCSS plugin + single CSS import).

postcss.config.js

export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

src/index.css

@import "tailwindcss";

tailwind.config.js (optional in v4; included for content scanning)

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}

If you ever see a dev overlay saying “install @tailwindcss/postcss”, run:

npm install -D @tailwindcss/postcss
🔌 Regulatory Data Handling

API: Federal Register

Base used: https://www.federalregister.gov/api/v1/documents.json

Params used: per_page, order=newest, page, and conditions[term] (for keyword search)

Fields consumed: title, publication_date, document_type, agencies[].name, abstract, citation, document_number, html_url.

Filtering

Keyword: server‑side via conditions[term].

Agency/Type/Date: client‑side over fetched results. Dates are compared as strings (YYYY-MM-DD).

Pagination: “Load more” increments page and appends results.

Bookmarks: stored as an array of document_number in localStorage under regx_bookmarks.

Security/Privacy: No backend, no secrets. Only public data is fetched; user bookmarks stay in the browser.

# 🧠 Thought Process & Architecture Decisions

Why Federal Register?

Public, rich metadata, no API key, predictable JSON → ideal for a timed challenge.

Why React + Vite?

Fast iteration, simple state model (useState/useMemo), minimal boilerplate.

Styling with Tailwind v4

Utility classes for speed and consistency. v4’s single‑import CSS keeps config light.

State management

Local component state is sufficient for this scope. Bookmarks persisted in localStorage.

Client‑side filtering

Simpler code, fewer API round‑trips; acceptable for ~hundreds of items. (Documented trade‑off below.)

Error handling

Network/HTTP errors surface in a toast‑like banner; retry by re‑searching.

Component structure (single file for brevity)

Header (search)

Sidebar (filters)

Grid (cards)

Pagination controls

Bookmarks section

Detail drawer

Given the timebox, all UI sits in App.jsx for readability; with more time this would be split into small components and hooks (e.g., useDocuments, Filters, Card, Drawer).

# ⚖️ Limitations & Trade‑offs

Client‑side filtering means the agency/type/date filters apply only to currently loaded pages. For large result sets, server‑side filters would be preferable.

No caching/data library (e.g., React Query/SWR). Simpler, but less resilient to re‑renders and refetches.

Basic accessibility only. With more time: keyboard focus trapping in the drawer, ARIA labels, color contrast checks.

Error UI is minimal; no automatic retry/backoff.

No unit/e2e tests included to keep the code compact.

U.S. Federal Register only (not SEC/EDGAR/FDA). Easy to swap later if needed.
