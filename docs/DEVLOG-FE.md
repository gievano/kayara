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
