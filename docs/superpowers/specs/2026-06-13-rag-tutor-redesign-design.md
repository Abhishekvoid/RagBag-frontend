# RAG Tutor Redesign — "Precise Focus" Design Spec

**Date:** 2026-06-13
**Status:** Draft for review
**Scope:** Full app — landing page, auth, dashboard (3-panel workspace)
**Product name (current):** StudyWise

---

## 1. Design Direction

**Precise Focus** — the engineering rigor of Linear fused with the calm, low-distraction depth of Obsidian, expressed through a **warm, earthy palette** with a single disciplined pop color (**marigold**).

The goal is a product that reads as *built and used by millions*, not AI-generated. The two biggest "AI tells" we are deliberately avoiding:
- Cold blue-black dark mode → we use **warm espresso/bark dark**.
- Decorative, everywhere-accent color → marigold is **scoped to meaning only**.

### Principles
1. **Depth from elevation, not borders.** Surfaces step up in warmth + lightness (canvas → panel → card). Borders are hairline and felt, never drawn loudly.
2. **One pop, used with discipline.** Marigold marks *meaning*: active focus, citations, focus rings, primary CTAs. Nothing else.
3. **Mono = engineered signal, scoped to metadata.** Chapter numbers, source tags, counts, timestamps, kickers. Reading text is always sans.
4. **The reading column breathes; the workspace is dense.** Obsidian density in chrome (sidebar, rails), generous measure + leading in the answer column.
5. **Motion is fast and physical.** 120–200ms ease-out. State changes snap and settle. Nothing bouncy, slow, or parallax-heavy.
6. **Copy matches the vibe.** Calm, confident, precise. Mono kickers (`// 3 sources`, `// thinking`). Never "🎉 Oops!" energy.
7. **Icons are a real icon set — never emojis.** Use `lucide-react` (already a dependency) for all iconography across landing, auth, and dashboard. No emoji characters in UI, copy, or empty/error states. Icons inherit `currentColor`, sit on the type baseline, and use consistent stroke width (1.5–2) and size steps (16 / 20 / 24).

---

## 2. Color System (tokens)

Primary mode is **Warm Dark**. **Paper** (light) is derived. Both are first-class but dark is perfected first.

Values are expressed in OKLCH (matches current `global.css`). These are target values; exact chroma to be tuned during implementation against contrast checks.

### Warm Dark (primary)
| Token | Role | Target |
|---|---|---|
| `--background` | canvas (espresso, brown undertone) | `oklch(0.16 0.012 60)` |
| `--card` | panel surface (1 step up) | `oklch(0.19 0.014 60)` |
| `--popover` / elevated card | 2 steps up | `oklch(0.22 0.016 60)` |
| `--foreground` | text (warm bone, never #FFF) | `oklch(0.94 0.01 75)` |
| `--muted` | recessed surface | `oklch(0.24 0.012 60)` |
| `--muted-foreground` | secondary text (warm taupe) | `oklch(0.68 0.02 70)` |
| `--border` | hairline warm | `oklch(0.28 0.012 60)` |
| `--input` | input border | `oklch(0.30 0.012 60)` |
| `--primary` (= marigold) | the pop | `oklch(0.78 0.16 70)` |
| `--primary-foreground` | text on marigold | `oklch(0.20 0.03 60)` |
| `--ring` | focus ring (marigold) | `oklch(0.78 0.16 70)` |
| `--destructive` | calm warm-red error | `oklch(0.58 0.16 30)` |

### Paper (light, derived)
| Token | Role | Target |
|---|---|---|
| `--background` | warm paper (not pure white) | `oklch(0.985 0.006 80)` |
| `--card` | raised paper | `oklch(0.995 0.004 80)` |
| `--foreground` | warm ink | `oklch(0.22 0.02 60)` |
| `--muted` | sand | `oklch(0.95 0.008 80)` |
| `--muted-foreground` | warm stone | `oklch(0.48 0.02 65)` |
| `--border` | warm hairline | `oklch(0.90 0.008 80)` |
| `--primary` (= marigold) | pop (slightly deeper for contrast on light) | `oklch(0.70 0.16 65)` |
| `--ring` | focus ring | `oklch(0.70 0.16 65)` |

### Marigold usage allow-list (the discipline)
Marigold may ONLY appear on:
- Active chapter / current-focus indicator (left edge + subtle wash)
- Source citation chips (text, tint, border, hover glow)
- Focus rings on inputs/interactive elements
- Primary CTA buttons (send, landing hero CTA, auth submit)
- Streaming "thinking" pulse

It may NOT be used for: generic headings, body text emphasis, decorative backgrounds, icons that aren't active, hover states on neutral items (those use a warm neutral wash).

### `src/config/themes.ts`
Replace the current 4-theme list (`light/dark/forest/pastel`) with the two real modes:
```ts
export const themes = [
  { name: "dark",  color: "#1a1410" },  // warm espresso
  { name: "light", color: "#faf8f5" },  // warm paper
];
```
Remove `forest` / `pastel` (generic, off-brand).

---

## 3. Typography

- **Sans (UI + reading):** Geist Sans (already available via the Next/Vercel ecosystem; confirm load). Fallback: Inter. Used for all headings, UI, and answer body.
- **Mono (metadata only):** Geist Mono / JetBrains Mono (already referenced in `global.css`). Used for: chapter numbers, source tags, citation chips, counts, timestamps, landing kickers.

### Type ramp (even steps, fixed line-heights)
| Token | Size / line-height | Use |
|---|---|---|
| `text-display` | 48px / 1.05, tight tracking | landing hero |
| `text-h1` | 30px / 1.15 | page titles |
| `text-h2` | 22px / 1.25 | panel/section titles |
| `text-h3` | 18px / 1.35 | card titles, chapter name |
| `text-body` | 15px / 1.7 | **answer reading text** (wide leading) |
| `text-sm` | 13px / 1.5 | UI labels, secondary |
| `text-meta` | 12px / 1.4, mono | counts, tags, timestamps |
| `text-micro` | 11px / 1.4, mono | kickers, disclaimers |

No sizes outside this ramp. Reading text is `text-body` at a comfortable measure (max ~70ch in the chat column).

---

## 4. Spacing, Radius, Borders

- **Spacing scale:** 4px base — `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`. All padding/margins/gaps come from this scale.
- **Radius:** `--radius: 0.625rem` (10px) for cards/inputs; chips/pills fully rounded; buttons 8px. Slightly softer than current 8px to feel warm, not sterile.
- **Borders:** uniformly `1px` `--border`. No mixed border widths. Active states add a `2px` marigold *left edge* (not full border).
- **Elevation:** warm, low-spread shadows only in dark mode's higher surfaces and popovers; in flat panels, depth comes from the surface-color step, not shadow.

---

## 5. Motion Language

Centralized timing tokens (used via Tailwind/CSS vars + framer-motion):
| Token | Duration | Easing | Use |
|---|---|---|---|
| `motion-fast` | 120ms | ease-out | hover, press, focus ring |
| `motion-base` | 180ms | ease-out | panel/state transitions, chip-in |
| `motion-slow` | 240ms | ease-out | popover, modal enter |
| stagger | 40ms | — | list reveals (chapters, sources) |

Rules:
- Press: `active:scale-[0.97]` (already a util — keep `active-press`).
- Enter: fade + 4–8px upward translate. No spring bounce in productivity chrome.
- Streaming chip-in: scale `0.96 → 1` + fade, 150ms, fires *after* its supporting sentence settles.
- Respect `prefers-reduced-motion`: disable translate/scale, keep opacity.

---

## 6. Signature Element — Citation System

This is the centerpiece. Example target:

> Transformers use self-attention to model relationships between tokens. `[Attention Is All You Need · p12]`

### Rendering
- Inline chip: warm **mono**, bracketed, marigold text, faint amber tint bg (`primary/10`), hairline amber border (`primary/30`), small rounded.
- Format: `[<Source Title> · p<page>]`. Long titles truncate with ellipsis at ~24ch; full title in hover popover.

### Parsing
- The assistant answer text is parsed for a citation token convention before markdown render. Convention: `[[cite:<sourceId>|<title>|<page>]]` emitted by the backend, OR a post-process step that matches a `[Title · pN]` pattern.
- **Decision:** implement a small `parseCitations(text)` util that splits the markdown stream into text + citation nodes, rendered via a custom react-markdown component (or a wrapping renderer). Citations map to entries in the message's `sources` metadata.
- If the backend does not yet emit citation metadata, the renderer **degrades gracefully**: any inline `[Title · pN]`-shaped text still styles as a (non-interactive) chip; the sources rail simply lists `chapter.documents`.

### Interactions
1. **Stream-in:** chip fades + scales in 150ms after its sentence lands.
2. **Hover chip:** lifts 1px, amber deepens, popover (200ms) shows source snippet + page.
3. **Click chip:** highlights the matching card in the per-answer **sources rail** (scroll into view + brief marigold ring).
4. **Hover rail card → its inline chips glow** (bidirectional link). This is the "connected knowledge" Obsidian feel — earned through interaction, no literal graph.

### Sources rail
Under each assistant answer: a thin row/stack of source cards (title mono, page, snippet on hover). Mono count header: `// 3 sources`.

---

## 7. Per-Surface Design

### 7.1 Landing page (`src/app/page.tsx` — currently redirects to login)
New marketing route. Sections:
1. **Hero:** warm-dark canvas. Mono kicker (`// retrieval-augmented tutor`), display headline (sans), one-line subhead, single **marigold CTA** + ghost secondary. Right: a realistic, static product vignette — an answer streaming with a glowing amber citation chip. Show, don't list.
2. **Proof strip:** thin mono row (e.g. subjects · sources cited · response feel). Engineered texture.
3. **Three capability blocks:** `ask → cited answer → study`. Each a small live-feeling vignette (real UI fragment), not icon + lorem.
4. **Closing CTA:** quiet, confident. Warm footer.
- Motion: fast scroll-reveals (fade + small translate, stagger). No parallax.
- Note: unauthenticated users land here; "Get started" → `/auth/register`, "Sign in" → `/auth/login`. Authenticated users may be routed to `/dashboard`.

### 7.2 Auth (`/auth/login`, `/auth/register`, components in `src/components/auth/`)
- **Split screen.** Left: form on paper-tinted panel. Right: warm-dark brand panel with one ambient marigold accent + one-line value prop. Coherent with landing.
- Inputs: hairline borders, **marigold focus ring**, label-above pattern.
- Errors: calm, warm, legible inline messages — no red explosions.
- Google OAuth button: restyled to match (neutral surface, hairline border), not default blue.

### 7.3 Dashboard (`src/app/dashboard/page.tsx` + `src/components/dashboard/**`)
Keep the `react-split` 3-panel structure and the Zustand + WebSocket data flow. This is a **re-skin + re-space + interaction polish**, not a rewrite.

- **Header (`Header/Header.tsx`):** slim, warm glass. Mono workspace/breadcrumb label, theme toggle (re-enable a 2-mode switcher), avatar + quiet menu. Reduce current weight; refine the StudyWise mark.
- **Left — Sidebar (`SideBar/NotebookSidebar.tsx`, `Subject/*`, `Chapter/*`):** Obsidian-dense subject→chapter tree. Active chapter: `2px` marigold left edge + subtle warm wash (reuse/retune `gradient-active`). Mono chapter numbers. Tight rows, clear hover (warm neutral wash via `gradient-hover`).
- **Center — Chat/Reading (`ContentPanel/ChatView.tsx`):**
  - Calm panel header (chapter name `text-h3`, mono `// N sources`).
  - Answer column: `text-body` 15/1.7, max ~70ch measure, generous vertical rhythm. Drop the current heavy `prose` overrides for a tuned, consistent set.
  - Replace user/bot bubble look: assistant answers are quiet (near-canvas, hairline), user messages are a warm muted surface — less "chat app," more "document." De-emphasize avatars (small, optional).
  - Integrate the **citation system** (Section 6) into the markdown renderer + add the sources rail.
  - **Streaming state:** replace the 3-dot bounce with a calm marigold "thinking" pulse + mono `// thinking`.
  - **Input:** refined single field, hairline border, marigold focus ring + send button; disclaimer in `text-micro`.
  - **Empty state (`EmptyState.tsx`):** intentional — short prompt suggestions as chips, mono kicker, not a shrug.
- **Right — Studio (`StudioPanel/*`):** flashcards + quiz as crisp warm cards, elevation-based. Mono counts (`12 cards · 4 quiz`). Loading skeletons pulse **warm**, not gray (retune `FlashcardSkeleton`, `QuestionsSkeleton`, `ChatSkeleton`).
- **Processing/ingestion states (`ProcessingState.tsx`, `AddSourceView.tsx`):** keep the existing pipeline logic; re-skin to the warm/mono engineered aesthetic.

---

## 8. Implementation Surface (files touched)

**Foundation (do first):**
- `src/app/global.css` — rewrite token blocks (`:root` = paper, `.dark` = warm espresso), motion vars, retune utilities (`glass`, `gradient-active`, `gradient-hover`), warm scrollbar.
- `tailwind.config.ts` — type ramp, spacing confirmations, font families, motion timings.
- `src/config/themes.ts` — 2 real themes.
- Fonts wired in `src/app/layout.tsx`.

**Shared primitives:**
- `src/components/ui/*` — button, input, card, dialog, select, textarea retuned to tokens (radius, focus ring, surfaces).
- New: `Citation` chip + `SourcesRail` + `parseCitations` util (likely under `src/components/dashboard/ContentPanel/` and `src/lib/`).

**Surfaces:**
- Landing: new `src/app/page.tsx` (+ landing section components).
- Auth: `src/components/auth/LoginForm.tsx`, `RegisterForm.tsx`, and `src/pages/auth/*` / `src/app/auth/*` routes.
- Dashboard: `Header`, `NotebookSidebar` + `Subject/Chapter`, `ContentPanel/ChatView` (+ Empty/Processing), `StudioPanel/*`, skeletons.

**Out of scope:** backend/API changes, Zustand store logic, WebSocket flow, auth logic. Citation metadata consumed if present; degrades gracefully if not.

---

## 9. Success Criteria

- Dark mode reads as warm espresso, not blue-black; no pure `#000`/`#FFF` anywhere.
- Marigold appears only on the allow-list (Section 2). A reviewer can find every marigold use and it always means "focus / citation / primary action."
- One type ramp, one spacing scale — no orphan font sizes or ad-hoc paddings.
- The citation chip renders, streams in, and links bidirectionally to the sources rail.
- All motion is 120–240ms ease-out, respects `prefers-reduced-motion`.
- Landing, auth, and dashboard feel like one product.
- All icons are `lucide-react` (existing inline SVGs in `ChatView`/`Header`/`Icons.tsx` migrated); zero emojis anywhere in the UI.
- No regression in existing data flow (chat, ingestion, flashcards, quiz still work).

---

## 10. Open Questions / Assumptions

- **Citation metadata:** assumed the backend can (or will) emit per-answer source references. Until then, graceful degradation (Section 6). Confirm backend capability during planning.
- **Font choice:** assumes Geist is loadable; if not, Inter (sans) + JetBrains Mono (mono) as confirmed fallbacks.
- **Product name:** keeping "StudyWise" unless you want a rename as part of branding.
