# Frontend Dev Log

## 2026-08-31 — Full frontend rebuild

### The Change

Rebuilt the homepage, level selection, exam, result, empty, and confirmation-dialog surfaces in `app/page.tsx`, `app/globals.css`, `app/layout.tsx`, `app/exam/[level]/page.tsx`, `app/exam/[level]/[year]/page.tsx`, and `app/exam/[level]/[year]/exam-client.tsx`.

### The Reasoning

The new system uses warm paper, sumi, vermilion, and sage with semantic CSS classes so every route shares one calm Japanese editorial language. Framer Motion is limited to reveals, stagger, question transitions, and direct interactions with reduced-motion support. Existing exam state, timer, session persistence, section flow, audio, reveal, and scoring behavior remain in place.

### The Tech Debt

The unused `/demo` route and `app/theme-toggle.tsx` still contain the superseded dark presentation. ESLint reports one pre-existing error in that unused toggle and warnings for raw question images plus two script variables.

## 2026-08-31 — Responsive LayeredText refinement

### The Change

Integrated `components/ui/layered-text.tsx` into the editorial homepage hero, made its GSAP movement responsive to the configured line heights, added reduced-motion handling, removed transform seam artifacts, and established adaptive 24–56px viewport gutters across homepage, level, result, and exam layouts.

### The Reasoning

GSAP remains limited to the referenced layered typography while Framer Motion owns page and question transitions. The hero now uses a bounded responsive height and denser right-side composition instead of forcing excess empty space at large viewport heights.

### The Tech Debt

The skewed text effect relies on browser font anti-aliasing, so its clipping inset should be visually checked when the Japanese font or line-height tokens change.

## 2026-08-31 — Deploy prep: README, git ignore, GitHub push

### The Change

Wrote a README describing the app, stack, and structure. Added `public/audio/` to `.gitignore`, set the `origin` remote to `gievano/kayara`, and pushed the rebuild to GitHub. The README was written to avoid common AI writing tells.

### The Reasoning

The `public/audio` folder held about 1.5 GB of MP3 files, too large for a Git repo and unnecessary since Choukai audio is streamed from external URLs stored in `data/questions.json`. Committing them would have made pushes slow and the Vercel build heavy. The README reflects the new editorial rebuild rather than the default create-next-app template.

### The Tech Debt

Choukai images were found to be present in `data/questions.json` (1,383 listening questions with images) but deliberately hidden in the exam UI, which only renders images outside the listening section. This was intentionally left unfixed for this commit at the user's request and should be addressed next. Audio is missing on a small set of N4/N5 listening questions generated locally.

## 2026-08-31 — Deploy, repo restructure, and branding

### The Change

Restructured the repo so the project lives directly at `Kayara/` instead of a `japanese-exam-app` subfolder, rewrote git history for a clean single-commit tree, pushed to `gievano/kayara`, and renamed `package.json` to `kayara`. Ignored `public/audio`, `graphify-out`, and the local agent files (`AGENTS.md`, `CLAUDE.md`). Rewrote the README as branding for the live app and deployed to Vercel.

### The Reasoning

The `Kayara` folder previously held an empty wrapper plus a `japanese-exam-app` subfolder holding the real project, which duplicated names and confused the repo. The final layout keeps one main `Kayara` folder. The audio MP3s (1.5 GB), graphify output, and local agent instructions were not project code and were removed from tracking. The Vercel project was recreated as `kayara` (the old `japanese-exam-app` project was deleted) with `kayara-jlpt.vercel.app` as the live URL, since the bare `kayara.vercel.app` subdomain is already taken by another account.

### The Tech Debt

The Vercel project `kayara` now connects to the GitHub repo `gievano/kayara` (linked via the Vercel API: type github, repo `kayara`, production branch `main`, createDeployments enabled). Auto-deploy was verified by triggering a production deployment from `main`, which built successfully to READY in the Vercel cloud. The live URL is `https://kayara-jlpt.vercel.app` (the bare `kayara.vercel.app` subdomain is taken by another account, so Vercel auto-generates `kayara-opal.vercel.app`, which is unused; we keep `kayara-jlpt`). The old `japanese-exam-app` Vercel project was deleted.

### The Tech Debt

Fixing the Choukai image visibility bug from a previous entry remains outstanding. When a fresh push to GitHub now auto-deploys, environment variables on the machine (`.env.local`) are not on Vercel, so env-dependent behavior must be set in the Vercel project dashboard if any is added later.

## 2026-08-31 — Fix Vercel 100MB limit: move question data to compressed static asset

### The Change

Replaced the build-time `import raw from "@/data/questions.json"` (130MB) with an architecture that keeps the heavy data out of the function bundle. `data/questions.json` is now gzipped to `public/questions.json.gz` (17.9MB) and read server-side by the new `lib/questions-server.ts` (`loadQuestions`, lazy `fs`+`zlib.gunzip` with a module-level cache). `lib/questions.ts` now only ships tiny `lib/metadata.json` (exams per level + per-exam/examCode section counts, ~10KB) and exposes sync metadata helpers (`getAvailableExams`, `getLevelMeta`, `countBySectionForExam`) used by the client components. `data/questions.json` is excluded from Vercel via a new `.vercelignore`. Also replaced the broken `next/font/google` (turbopack couldn't resolve `@vercel/turbopack-next/internal/font/google/font`) with plain Google Fonts `<link>` in `app/layout.tsx` plus OS fallbacks in `app/globals.css`.

### The Reasoning

The build previously bundled the entire 130MB JSON into every server component that imported it, blowing past Vercel's 100MB function-size limit ("File size limit exceeded"). Metadata for listings/counts (homepage, level page, exam existence checks) needs no question content, so it scales down to ~10KB of JSON. Full question arrays are fetched server-side from the static gz only on the exam route, cached across calls. The `next/font/google` error was unrelated to the size problem but equally blocking, so it was replaced with the standard optimized font-loading `<link>`.

### The Tech Debt

`lib/questions-server.ts` is server-only by contract (raw `fs`/`zlib`, no client guard) — a client-side fetch for `questions.json.gz` would be needed if a route ever loads questions in the browser. `getQuestions`/`loadQuestions` in the old `lib/questions.ts` (year-based filtering) were removed since nothing used them; the year-based import in `exam-client.tsx` still references the type-only `Question`/`Section`. The 130MB `data/questions.json` remains in git LFS and `.vercelignore`; it is the single source for regenerating `public/questions.json.gz` and `lib/metadata.json` (e.g., via `gzip -k` + a node script) when questions change.



## 2026-08-31 - Choukai audio & gambar fix (sync 1:1 dengan Ten)

### The Change

- Baru: same-origin audio proxy di `app/api/audio/route.ts` (GET ?u=) — memvalidasi host `drive.usercontent.google.com`, meneruskan `Range` request dari browser, dan mengembalikan response `206`/`audio/mpeg` + `Accept-Ranges: bytes` + `Access-Control-Allow-Origin: *`.
- `app/exam/[level]/[year]/exam-client.tsx`: `proxyAudio()` menulis ulang `src` audio Drive jadi `/api/audio?u=...` di elemen `<audio>` (layar soal & hasil); `play()` di-hardening (handle Promise rejection `audio.play()`, set `preload="auto"`, dan set `isSpeaking` untuk feedback ikon saat audio diputar). Hapus kondisi `!listening` pada render `question.image` agar gambar choukai N5/N4/N3 muncul.
- Utility baru: `scripts/sync-listening.mjs` (fetch listening 1:1 dari ten-jlpt-site) dan `scripts/regenerate.mjs` (bangun `public/questions.json.gz` + `lib/metadata.json` dari `data/questions.json`).

### The Reasoning

- `<audio src=drive.usercontent.google.com>` gagal diputar di browser nyata (user: "player ada tapi diam") meski URL valid (206 + CORS open). Root cause paling resisten adalah redirect/set-cookie consent Google yang beda di browser vs fetch node. Proxy same-origin menghilangkan seluruh ketidakpastian CORS/cookie sehingga `<audio>` same-origin dijamin playable & seekable.
- Gambar listening (opsi ①②③④) sempat tidak dirender karena guard `!listening`; dihapus karena N5/N4/N3 100% punya `image` valid (URL Drive, `<img>` tak terikat CORS).

### The Tech Debt

- `data/questions.json` TERNYATA identik dengan HEAD (LFS sha256 cocok, 9946 soal) — artinya data listening sudah 1:1 dari Ten sejak sebelumnya; session ini tidak mengubah data sama sekali.
- `lib/metadata.json` + `public/questions.json.gz` hanya beda byte (urutan kunci level + level kompresi), isi semantik sama — sengaja di-revert agar tidak ada churn di commit.
- 52 soal `test_2` (N4/N5) memang tanpa audio di Ten (`audio: null`, `sec.media.audio: []`) — fallback ke speechSynthesis.


## 2026-08-31 - Fix gambar choukai kosong (proxy image via /api/audio)

### The Change

- `app/exam/[level]/[year]/exam-client.tsx`: rename `proxyAudio` -> `proxied` dan terapkan ke semua `<img src>` (soal & hasil review) selain `<audio>`. Kini `question.image` dan `item.image` yang host-nya `drive.usercontent.google.com` dirender sebagai `/api/audio?u=...` sehingga lolos consent/redirect Google Drive yang bikin `<img>` kosong di browser.

### The Reasoning

- `<img src=drive...>` juga kena cookie consent redirect yang sama seperti `<audio>`; tanpa proxy, browser menampilkan broken image (kosong). Proxy same-origin (`/api/audio`) meneruskan `image/png`/`image/jpeg` dengan header CORS open, jadi gambar N5/N4/N3 (opsi ①②③④) yang 100% punya image kini tampil.

### The Tech Debt

- Endpoint masih bernama `/api/audio` meski kini melayani image juga; rename ke `/api/media` bisa dipertimbangkan bila ada media lain.
