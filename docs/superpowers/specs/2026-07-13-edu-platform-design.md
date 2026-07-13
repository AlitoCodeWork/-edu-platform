# Plataforma Educativa (Informática) — Design Spec

- **Date:** 2026-07-13
- **Status:** Approved (design), pending implementation plan
- **Author:** Ale (with Claude)

## 1. Overview

A free educational web platform focused on computer science, served from the
user's droplet at `center.alito.me`. It aggregates **free, legally
redistributable/viewable** learning material from many open sources (videos,
books, magazines, documentaries, papers, images, news), lets users **view**
everything that is legal to view (YouTube via official embed) and **download**
only what is legally downloadable (public domain, Creative Commons, open
access). On top of the content sits a gamified learning layer: accounts,
topic exams/quizzes, per-user statistics, a weekly leaderboard, and a weekly
competition challenge.

The site doubles as a genuine, useful product that shares the `center.alito.me`
domain with the user's existing obfuscated tunnel (the tunnel moves to a secret
WebSocket path so a real website occupies the domain).

## 2. Legal boundaries (hard constraints — enforced in code)

- **Never rehost** third-party copyrighted content. The platform stores only
  metadata (title, source, license, source URL, embed URL) — never the media
  file itself.
- Every content result carries its **source** and **license**.
- A **Download** action is shown ONLY when the item's license permits download
  (public domain, Creative Commons, open access). This is enforced by a single
  server-side policy function — not left to the UI.
- **YouTube:** view via official embed iframe ONLY. Never a download action.
- **News:** headline + summary + link to the original source ONLY. Never
  rehosted, never downloadable.
- No integration with YouTube-download / "yt-to-mp4" style third-party
  services. Their use violates YouTube's Terms; excluded by design.

## 3. Scope

**In scope (v1)**
- Preloaded home sections (categories) filled from open sources + admin-pinned
  featured items.
- Multi-source, multi-type live search (aggregator).
- In-app viewer (embeds / readers) and legal download links.
- Accounts (email + password, cookie session).
- Topic exams/quizzes with automatic scoring.
- Per-user statistics (exams taken, average, per-topic progress, streak).
- Weekly leaderboard (global, resets weekly).
- Weekly competition (a featured challenge exam that feeds the leaderboard).

**Out of scope (later phases)**
- Real-time 1v1 duels / live multiplayer competitions.
- Achievements/badges are optional in v1 (schema stubbed, UI may be deferred).
- Mind/skill games (separate future phase).
- User-generated content uploads.

## 4. Architecture

- **Next.js (full-stack)** — frontend + API route handlers in one Node
  container, server-side rendered (reads as a real site; good camouflage).
- **Postgres** — a new database `edu` on the droplet (reuse the existing
  Postgres service or a sibling one).
- **Caddy** on `center.alito.me` routes:
  - the tunnel's WebSocket, moved to a **secret upgrade path prefix**, to
    `wstunnel`;
  - everything else to the Next.js app.
- **Tunnel coexistence:** wstunnel client + server are reconfigured to use
  `--http-upgrade-path-prefix <secret>` so Caddy can distinguish tunnel
  traffic from normal web visits. This also strengthens obfuscation (the site
  is real; the tunnel hides on an obscure path).

```
Browser ─▶ Caddy (center.alito.me)
             ├─ path = /<secret-ws-prefix>/*  ─▶ wstunnel ─▶ OpenVPN (tunnel)
             └─ everything else               ─▶ Next.js (edu platform) ─▶ Postgres(edu)
                                                        └─▶ external open-content APIs
```

## 5. Content model (hybrid)

**Preloaded sections (home):** curated categories, each backed by predefined
queries against the open sources plus admin-pinned featured items, so the home
is full of material without the user searching. Initial categories:
Programación, Redes/Seguridad, IA & Datos, Sistemas Operativos, Documentales,
Libros, Papers, Revistas.

**Live search (aggregator):** a query fans out to sources by type; results are
normalized to a common shape and tagged with an action derived from the license
policy.

| Type | Free/legal sources | Action |
|---|---|---|
| Videos / documentaries | YouTube Data API, Internet Archive | View (embed); download only Archive PD/CC |
| Books | Project Gutenberg (Gutendex), DOAB, Standard Ebooks, Open Library | Read + Download (open-license) |
| Magazines | Internet Archive (PD/CC collections), open-access | View + Download where license permits |
| Papers / articles | arXiv, OpenAlex, DOAJ, PubMed Central | View + Download PDF (open access) |
| Images / media | Wikimedia Commons, Openverse | View + Download (CC/PD) |
| News | RSS / News API (headline + summary + link) | Go to source ONLY (never rehost) |

Search results are **not persisted** — they are fetched live and cached briefly
in memory/edge cache only.

### Normalized result shape
```
ContentResult {
  id: string            // source-prefixed, e.g. "yt:abc123"
  type: "video" | "book" | "magazine" | "paper" | "image" | "news"
  title: string
  source: string        // "youtube" | "archive" | "gutenberg" | ...
  license: string       // "youtube-embed" | "public-domain" | "cc-by" | "open-access" | "news-link"
  thumbnail?: string
  embedUrl?: string     // for in-app viewing
  downloadUrl?: string  // present only if policy allows
  sourceUrl: string     // canonical link to the origin
}
```

### License policy (single source of truth)
`canDownload(license): boolean` — true only for public-domain, cc-*,
open-access. false for youtube-embed and news-link. The API attaches
`downloadUrl` only when `canDownload` is true; the UI shows Download only when
`downloadUrl` is present.

## 6. Data model (Postgres `edu`)

- `users` (id, email unique, password_hash, name, created_at)
- `categories` (id, slug, name, description, sort_order)
- `featured_items` (id, category_id, content_json, pinned_by, sort_order) —
  admin-pinned normalized ContentResult snapshots for the home sections
- `topics` (id, category_id, name)
- `exams` (id, topic_id, title, is_competition bool, week nullable)
- `questions` (id, exam_id, prompt, options_json, correct_index)
- `attempts` (id, user_id, exam_id, score, max_score, week, created_at)
- `competitions` (id, exam_id, week unique, title)
- `achievements` (id, user_id, code, earned_at) — optional in v1

Weekly aggregation uses ISO week keys (e.g. `2026-W29`) stored in `attempts.week`.

## 7. Pages / features

- **Home** — preloaded category sections + featured items; entry to search.
- **Search** — query bar + type/category filters; normalized results with
  View / Download / Go-to-source per the license policy.
- **Viewer** — embed video/reader; legal download button when permitted.
- **Auth** — register / login (email + password, hashed; cookie session).
- **Exams** — pick a topic → answer questions → automatic scoring → attempt
  saved.
- **Profile/Stats** — exams taken, average score, per-topic progress, streak.
- **Leaderboard** — global weekly ranking aggregated from `attempts` by ISO
  week; resets each week.
- **Competition** — the current week's featured challenge exam; results feed
  the leaderboard.

## 8. External dependencies

- **YouTube Data API v3** key (free, daily quota — must be managed/cached).
- Open APIs: Internet Archive, Gutendex, arXiv, OpenAlex, DOAJ, PubMed Central,
  Wikimedia Commons, Openverse, RSS/News source. Most need no key or a simple
  key. Each wrapped behind a small adapter with a uniform interface so sources
  can be added/removed without touching the aggregator.

## 9. Error handling

- A failing/slow source must not break search: each adapter is called with a
  timeout; failures are logged and that source is skipped (partial results are
  fine, surfaced with a subtle "algunas fuentes no respondieron" note).
- YouTube quota exhaustion: degrade gracefully (hide YouTube results, keep the
  rest) — never hard-fail the page.
- Auth errors, exam submission errors: explicit user-facing messages.

## 10. Deployment

- A new `edu` service in a docker-compose (sibling to or alongside
  marketplace-cuba), building the Next.js app.
- Postgres `edu` database (new DB on the existing server or a sibling service).
- Caddy config updated: add the `center.alito.me` site block routing to the
  Next.js app, and move the tunnel's wstunnel to a secret upgrade-path prefix.
- Env: `YOUTUBE_API_KEY`, DB connection, session secret, the secret WS path.

## 11. Testing

- **Unit:** license policy (`canDownload` per license), ISO-week key
  computation, result normalization per adapter, exam scoring.
- **Integration:** each source adapter against a recorded/fixture response;
  aggregator partial-failure behavior; auth flow; attempt → leaderboard
  aggregation.
- **Manual E2E:** home loads preloaded sections; search returns mixed types
  with correct actions; view a YouTube embed (no download button); download a
  Gutenberg book; register → take exam → see score → appear on weekly
  leaderboard; tunnel still works on the secret path.

## 12. Phasing note

v1 is large. The implementation plan MUST sequence it into independently
testable phases (e.g. 1: scaffold + Caddy/tunnel coexistence; 2: content
adapters + license policy + search; 3: home/preloaded sections; 4: auth;
5: exams + scoring; 6: stats + weekly leaderboard + competition). Each phase
produces working, testable software.

## 13. Open questions

None outstanding; design approved. (Admin tooling for pinning featured items
can be minimal/manual in v1 — direct DB seed is acceptable.)
