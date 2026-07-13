# Plataforma Educativa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A free CS education platform at `center.alito.me` — hybrid content (preloaded sections + multi-source legal search), accounts, exams, weekly leaderboard and competition — self-hosted on the droplet, coexisting with the tunnel.

**Architecture:** Next.js (App Router, TypeScript) full-stack + Prisma/Postgres, in a Docker container behind Caddy. Content comes live from open-source APIs via per-source adapters behind a single aggregator; a server-side license policy decides what is downloadable. Pure logic (license policy, ISO-week, normalization, scoring, aggregation) is unit-tested with Vitest; framework glue is integration/E2E verified.

**Tech Stack:** Next.js 15, TypeScript, Prisma, Postgres, bcryptjs + jose (JWT cookie sessions), Vitest, Docker, Caddy.

## Global Constraints

- **Legal (enforced in code):** never rehost media; store only metadata. Download action ONLY when `canDownload(license)` is true (public-domain | cc | open-access). YouTube = embed only, never download. News = link to source only. No yt-download services.
- Served from the droplet behind Caddy at `center.alito.me`; the tunnel moves to a secret WS upgrade-path prefix so the site and tunnel coexist.
- UI copy: Spanish. Code identifiers, comments, docs: English.
- Weekly aggregation uses ISO-week keys like `2026-W29`.
- Search results are never persisted (live + short cache only).
- Each source is a self-contained adapter with a uniform interface; adding/removing a source must not touch the aggregator.
- Frequent commits: one per task.

---

## Shared Types (defined in Phase 2, referenced throughout)

```ts
// src/lib/content/types.ts
export type ContentType = "video" | "book" | "magazine" | "paper" | "image" | "news";
export type License = "youtube-embed" | "public-domain" | "cc" | "open-access" | "news-link";

export interface RawResult {
  id: string; type: ContentType; title: string; source: string;
  license: License; thumbnail?: string; embedUrl?: string;
  downloadUrl?: string; sourceUrl: string;
}
export interface ContentResult extends RawResult {} // post-policy (downloadUrl stripped if not allowed)

export interface SourceAdapter {
  name: string;
  types: ContentType[];
  search(q: string, signal: AbortSignal): Promise<RawResult[]>;
}
```

---

# PHASE 1 — Scaffold + tunnel coexistence

### Task 1.1: Next.js + Prisma scaffold

**Files:** create the project skeleton under `edu-platform/` (the docs already live there).

- [ ] **Step 1: Scaffold Next.js (TypeScript, App Router, no src conflicts)**

Run in `C:\Users\Ale\edu-platform`:
```bash
npx create-next-app@latest . --ts --app --eslint --src-dir --use-npm --no-tailwind --import-alias "@/*" --yes
```
Expected: Next.js app created alongside `docs/`. If it refuses (non-empty dir), scaffold in a temp dir and copy in (excluding its own docs).

- [ ] **Step 2: Add deps**
```bash
npm i @prisma/client bcryptjs jose
npm i -D prisma vitest @vitest/coverage-v8 @types/bcryptjs
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 3: Add test script + vitest config**

`package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.
Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node", include: ["src/**/*.test.ts"] } });
```

- [ ] **Step 4: Verify**
```bash
npm run test   # 0 tests, exits 0
npm run build  # compiles
```
Expected: both succeed.

- [ ] **Step 5: Commit**
```bash
git init && git add -A && git commit -m "chore: scaffold next.js + prisma + vitest"
```

### Task 1.2: Prisma schema + migration

**Files:** `prisma/schema.prisma`

**Interfaces:** Produces the DB models used by all later phases: `User, Category, FeaturedItem, Topic, Exam, Question, Attempt, Competition, Achievement`.

- [ ] **Step 1: Write the schema**
```prisma
model User { id String @id @default(cuid()) email String @unique passwordHash String name String createdAt DateTime @default(now()) attempts Attempt[] }
model Category { id String @id @default(cuid()) slug String @unique name String description String? sortOrder Int @default(0) topics Topic[] featured FeaturedItem[] }
model FeaturedItem { id String @id @default(cuid()) categoryId String category Category @relation(fields:[categoryId], references:[id]) contentJson Json sortOrder Int @default(0) }
model Topic { id String @id @default(cuid()) categoryId String category Category @relation(fields:[categoryId], references:[id]) name String exams Exam[] }
model Exam { id String @id @default(cuid()) topicId String topic Topic @relation(fields:[topicId], references:[id]) title String isCompetition Boolean @default(false) week String? questions Question[] attempts Attempt[] }
model Question { id String @id @default(cuid()) examId String exam Exam @relation(fields:[examId], references:[id]) prompt String optionsJson Json correctIndex Int }
model Attempt { id String @id @default(cuid()) userId String user User @relation(fields:[userId], references:[id]) examId String exam Exam @relation(fields:[examId], references:[id]) score Int maxScore Int week String createdAt DateTime @default(now()) }
model Competition { id String @id @default(cuid()) examId String @unique week String @unique title String }
model Achievement { id String @id @default(cuid()) userId String code String earnedAt DateTime @default(now()) }
```

- [ ] **Step 2: Run migration against a local Postgres** (set `DATABASE_URL` in `.env`)
```bash
npx prisma migrate dev --name init
```
Expected: migration applies, Prisma Client generated.

- [ ] **Step 3: Commit**
```bash
git add -A && git commit -m "feat: prisma schema + init migration"
```

### Task 1.3: Caddy + tunnel coexistence (config only, applied at deploy)

**Files:** `deploy/Caddyfile.snippet`, `deploy/README.md` (documented; applied on the droplet during Phase 1 deploy dry-run)

- [ ] **Step 1: Write the Caddy site block**
```
center.alito.me {
    @tunnel path /__ws-<SECRET>/*
    handle @tunnel { reverse_proxy wstunnel:8080 }
    handle { reverse_proxy edu:3000 }
}
```

- [ ] **Step 2: Document the wstunnel reconfiguration**

In `deploy/README.md`: the wstunnel **server** command adds
`--restrict-http-upgrade-path-prefix __ws-<SECRET>` and the **client** adds
`--http-upgrade-path-prefix __ws-<SECRET>` (Tunnel Launcher's wstunnel arg
builder gets the same prefix). Explain that this frees the domain root for the
website while the tunnel lives on the secret path.

- [ ] **Step 3: Commit**
```bash
git add -A && git commit -m "docs: caddy + tunnel coexistence config"
```

---

# PHASE 2 — License policy, types, adapters, aggregator, search API

### Task 2.1: Types + license policy

**Files:** `src/lib/content/types.ts`, `src/lib/content/policy.ts`, `src/lib/content/policy.test.ts`

**Interfaces:** Produces `canDownload(license)` and `applyPolicy(raw): ContentResult` used by every adapter/aggregator.

- [ ] **Step 1: Write the failing test** (`policy.test.ts`)
```ts
import { describe, it, expect } from "vitest";
import { canDownload, applyPolicy } from "./policy";
import type { RawResult } from "./types";

const base: RawResult = { id: "x", type: "video", title: "t", source: "s", license: "youtube-embed", sourceUrl: "u", downloadUrl: "d" };

describe("canDownload", () => {
  it("allows open licenses", () => {
    for (const l of ["public-domain", "cc", "open-access"] as const) expect(canDownload(l)).toBe(true);
  });
  it("blocks youtube and news", () => {
    expect(canDownload("youtube-embed")).toBe(false);
    expect(canDownload("news-link")).toBe(false);
  });
});
describe("applyPolicy", () => {
  it("strips downloadUrl when not allowed", () => {
    expect(applyPolicy({ ...base, license: "youtube-embed" }).downloadUrl).toBeUndefined();
  });
  it("keeps downloadUrl when allowed", () => {
    expect(applyPolicy({ ...base, license: "public-domain" }).downloadUrl).toBe("d");
  });
});
```

- [ ] **Step 2: Run — fails** (`npx vitest run src/lib/content/policy.test.ts`)

- [ ] **Step 3: Implement** (`types.ts` per "Shared Types" above; `policy.ts`)
```ts
import type { License, RawResult, ContentResult } from "./types";
export function canDownload(license: License): boolean {
  return license === "public-domain" || license === "cc" || license === "open-access";
}
export function applyPolicy(raw: RawResult): ContentResult {
  return canDownload(raw.license) ? { ...raw } : { ...raw, downloadUrl: undefined };
}
```

- [ ] **Step 4: Run — passes.**  **Step 5: Commit** `feat: content types + license policy`.

### Task 2.2: ISO-week helper

**Files:** `src/lib/week.ts`, `src/lib/week.test.ts`

**Interfaces:** `isoWeekKey(d: Date): string` → `"YYYY-Www"`. Used by attempts, leaderboard, competitions.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from "vitest";
import { isoWeekKey } from "./week";
describe("isoWeekKey", () => {
  it("formats ISO week", () => {
    expect(isoWeekKey(new Date("2026-07-13T00:00:00Z"))).toBe("2026-W29");
  });
  it("handles year boundary (2027-01-01 is 2026-W53)", () => {
    expect(isoWeekKey(new Date("2027-01-01T00:00:00Z"))).toBe("2026-W53");
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement**
```ts
export function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
```

- [ ] **Step 4: Run — passes.**  **Step 5: Commit** `feat: iso-week key helper`.

### Task 2.3: First adapter (Project Gutenberg / Gutendex) + adapter contract

**Files:** `src/lib/content/adapters/gutendex.ts`, `src/lib/content/adapters/gutendex.test.ts`

**Interfaces:** Implements `SourceAdapter`. `search()` maps Gutendex JSON → `RawResult[]` (type `book`, license `public-domain`, downloadUrl = the epub/text link). Consumes `types.ts`.

- [ ] **Step 1: Failing test with a fixture** (map a captured Gutendex response object → assert normalized fields, license `public-domain`, downloadUrl present).
```ts
import { describe, it, expect } from "vitest";
import { mapGutendex } from "./gutendex";
const fixture = { results: [{ id: 1342, title: "Pride and Prejudice", formats: { "application/epub+zip": "https://.../pg1342.epub", "image/jpeg": "https://.../cover.jpg" } }] };
describe("mapGutendex", () => {
  it("normalizes to a public-domain book", () => {
    const r = mapGutendex(fixture)[0];
    expect(r.type).toBe("book");
    expect(r.license).toBe("public-domain");
    expect(r.downloadUrl).toContain(".epub");
    expect(r.thumbnail).toContain("cover");
    expect(r.id).toBe("gutenberg:1342");
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement** `mapGutendex(json)` (pure) + the adapter `search()` that fetches `https://gutendex.com/books?search=<q>` with the passed `AbortSignal`, then calls `mapGutendex`. Export `const gutendex: SourceAdapter`.

- [ ] **Step 4: Run — passes.**  **Step 5: Commit** `feat: gutendex adapter + contract`.

### Task 2.4: Remaining adapters (one task each, same TDD shape as 2.3)

For each source, a task mirroring Task 2.3 (fixture → `mapX` pure test → `search()` wrapper). Sources and their fixed license/type:

- [ ] **2.4a Internet Archive** (`archive`) — types video/magazine/book; license per item (`public-domain`/`cc`); download via `https://archive.org/download/<id>`. Test the license derivation from item metadata.
- [ ] **2.4b arXiv** (`arxiv`) — type `paper`; license `open-access`; downloadUrl = PDF link; parse the Atom XML fixture.
- [ ] **2.4c OpenAlex** (`openalex`) — type `paper`; license `open-access` only when `open_access.is_oa` true (else no downloadUrl → still viewable via sourceUrl).
- [ ] **2.4d Wikimedia Commons / Openverse** (`media`) — type `image`; license `cc`/`public-domain`; downloadUrl = file URL.
- [ ] **2.4e YouTube Data API** (`youtube`) — type `video`; license `youtube-embed`; `embedUrl` = `https://www.youtube.com/embed/<id>`; **no downloadUrl ever**. Test asserts downloadUrl is undefined.
- [ ] **2.4f News (RSS/News API)** (`news`) — type `news`; license `news-link`; only `sourceUrl` (link-out); test asserts no embedUrl and no downloadUrl.

Each: fixture test → `mapX` → `search()` → commit `feat: <source> adapter`.

### Task 2.5: Aggregator (parallel fan-out, per-source timeout, partial failure)

**Files:** `src/lib/content/aggregator.ts`, `src/lib/content/aggregator.test.ts`

**Interfaces:** `aggregate(query, opts): Promise<{ results: ContentResult[]; failedSources: string[] }>`. Consumes the adapter list + `applyPolicy`. Produces the search payload.

- [ ] **Step 1: Failing test** with two fake adapters (one resolves, one rejects/times out) → assert results include the good source, `failedSources` includes the bad one, and `applyPolicy` was applied (a youtube-embed raw with downloadUrl comes back stripped).

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement**: `Promise.allSettled` over adapters filtered by requested types, each wrapped with an `AbortController` timeout; flatten fulfilled results through `applyPolicy`; collect rejected adapter names into `failedSources`.

- [ ] **Step 4: Run — passes.**  **Step 5: Commit** `feat: content aggregator with partial-failure handling`.

### Task 2.6: Search API route + result cache

**Files:** `src/app/api/search/route.ts`, `src/lib/content/cache.ts`

**Interfaces:** `GET /api/search?q=&types=` → `{ results, failedSources }`. Server-side only (hides `YOUTUBE_API_KEY`). Short in-memory TTL cache keyed by `q+types`.

- [ ] **Step 1:** implement the cache (`get/set` with TTL) with a unit test (set → get within TTL returns value; after TTL returns undefined using an injected clock).
- [ ] **Step 2:** implement the route handler calling `aggregate`, wrapped by the cache. Manual check: `curl "localhost:3000/api/search?q=python&types=book,paper"` returns mixed results; YouTube items have no `downloadUrl`.
- [ ] **Step 3: Commit** `feat: /api/search route + ttl cache`.

---

# PHASE 3 — Home + preloaded sections + search UI

### Task 3.1: Category seed + sections API
**Files:** `prisma/seed.ts`, `src/app/api/sections/route.ts`
- [ ] Seed the initial `categories` (+ their predefined source queries) and any `featured_items`. `GET /api/sections` returns each category with results (aggregated by its query, cached). Commit.

### Task 3.2: Home page (SSR preloaded sections)
**Files:** `src/app/page.tsx`, `src/components/ContentCard.tsx`, `src/components/SectionRow.tsx`
- [ ] SSR the home: render each category as a row of `ContentCard`s. `ContentCard` shows View/Download/Go-to-source strictly from the presence of `embedUrl`/`downloadUrl`/`sourceUrl` (the policy already stripped illegal downloads). Manual check: home loads full of content; YouTube cards have no Download. Commit.

### Task 3.3: Search page + viewer
**Files:** `src/app/buscar/page.tsx`, `src/components/Viewer.tsx`
- [ ] Search box + type/category filters calling `/api/search`; results grid; `Viewer` embeds video/reader (iframe) or shows the legal download. Manual E2E: search returns mixed types; embed a YouTube video (no download); download a Gutenberg book. Commit.

---

# PHASE 4 — Accounts

### Task 4.1: Password hashing + session token (pure-ish, TDD)
**Files:** `src/lib/auth/password.ts` (bcryptjs wrap), `src/lib/auth/session.ts` (jose sign/verify), tests.
- [ ] Test: `hashPassword` then `verifyPassword` round-trips true, wrong password false. Test: `signSession(userId)` → `verifySession(token)` returns the userId; a tampered token verifies to null. Implement. Commit.

### Task 4.2: Register/login API + cookie
**Files:** `src/app/api/auth/register/route.ts`, `src/app/api/auth/login/route.ts`, `src/lib/auth/current.ts`
- [ ] Register (unique email, hash, create user), login (verify → set httpOnly session cookie), `getCurrentUser()` from the cookie. Integration test the flow against the test DB. Commit.

### Task 4.3: Auth pages + guard
**Files:** `src/app/registro/page.tsx`, `src/app/login/page.tsx`, `src/middleware.ts`
- [ ] Forms (Spanish), and middleware guarding `/examenes`, `/perfil`, `/competencia`. Manual E2E: register → logged in → protected pages reachable. Commit.

---

# PHASE 5 — Exams + scoring

### Task 5.1: Exam scoring (pure, TDD)
**Files:** `src/lib/exam/score.ts`, `src/lib/exam/score.test.ts`
- [ ] Test: `scoreAttempt(correctIndexes, answers)` returns `{ score, maxScore }` counting matches; handles wrong-length/blank answers (missing → wrong). Implement. Commit.

### Task 5.2: Exam APIs
**Files:** `src/app/api/exams/[id]/route.ts` (GET questions without correct answers), `src/app/api/exams/[id]/submit/route.ts` (POST answers → score → create `Attempt` with `week=isoWeekKey(now)`).
- [ ] GET strips `correctIndex` from questions. POST requires auth, scores via `scoreAttempt`, persists the attempt. Integration test: seeded exam → submit → attempt row with correct score + week. Commit.

### Task 5.3: Exam pages
**Files:** `src/app/examenes/page.tsx` (list by topic), `src/app/examen/[id]/page.tsx` (take + submit + result)
- [ ] Take an exam, submit, see the score. Manual E2E. Commit.

---

# PHASE 6 — Stats, weekly leaderboard, competition

### Task 6.1: Leaderboard aggregation (TDD on the shaping)
**Files:** `src/lib/leaderboard.ts`, `src/lib/leaderboard.test.ts`
- [ ] Test `rankWeekly(attempts)` (pure): given attempts `{userId, score, week}`, for the target week sum each user's best-per-exam (or total — pick and assert), sort desc, return ranked rows. Implement pure ranker. Commit.

### Task 6.2: Leaderboard + stats + competition APIs & pages
**Files:** `src/app/api/leaderboard/route.ts`, `src/app/ranking/page.tsx`, `src/app/perfil/page.tsx`, `src/app/api/competition/route.ts`, `src/app/competencia/page.tsx`
- [ ] `GET /api/leaderboard?week=` uses Prisma to fetch the week's attempts then `rankWeekly`. Ranking page renders it. Profile shows the user's stats (attempts, avg, per-topic progress, streak). Competition page serves the week's `Competition` exam (feeds the same attempts → leaderboard). Manual E2E: take the weekly competition → appear on the weekly ranking. Commit.

---

# PHASE 7 — Deploy (with the user)

### Task 7.1: Dockerize + compose + Caddy + tunnel path
**Files:** `Dockerfile` (Next.js standalone), `deploy/docker-compose.edu.yml`
- [ ] Build the image; add the `edu` service + `edu` Postgres DB; apply the Phase-1 Caddy block; reconfigure wstunnel client+server to the secret path; run migrations on the droplet. Manual E2E on the droplet: site serves at `center.alito.me`, and the tunnel still connects on the secret path (Tunnel Launcher → Probar conexión OK, exit IP = droplet). Commit.

---

## Self-Review

**Spec coverage:** Legal policy → Task 2.1 (+ enforced in every adapter/aggregator/card). Tunnel coexistence → 1.3, 7.1. Hybrid content (adapters/aggregator/search) → 2.3–2.6; preloaded sections → 3.1–3.2. Auth → 4.x. Exams/scoring → 5.x. Stats/weekly leaderboard/competition → 6.x. Data model → 1.2. Deployment → 7.1. Multi-type sources (video/book/magazine/paper/image/news) → 2.4a–f. All spec sections covered.

**Placeholder scan:** No TBD/TODO. Pure-logic tasks carry full test code; adapter/UI/deploy tasks carry concrete file paths, the exact normalization contract, and integration/manual verification (called out as such rather than faked unit tests).

**Type consistency:** `RawResult`/`ContentResult`/`SourceAdapter` defined once (Shared Types / Task 2.1) and consumed by every adapter, the aggregator, `/api/search`, and the cards. `isoWeekKey` (2.2) is reused by attempts (5.2) and leaderboard (6.x). `scoreAttempt` (5.1) is consumed by 5.2. `canDownload`/`applyPolicy` names are consistent across 2.1, 2.5, 2.6, 3.2.

**Notes to verify during implementation (use context7):** exact Gutendex/arXiv/OpenAlex/Archive/YouTube response shapes for the fixtures; Next.js 15 route-handler + middleware signatures; Prisma `groupBy` for the leaderboard query.
