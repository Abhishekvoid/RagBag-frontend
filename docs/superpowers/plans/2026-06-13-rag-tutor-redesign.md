# RAG Tutor "Precise Focus" Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the RAG tutor frontend (landing, auth, dashboard) into the "Precise Focus" identity — warm-dark primary + warm-paper light, a single disciplined marigold pop, mono metadata, a citation-chip signature interaction, and Linear-fast motion.

**Architecture:** Token-first re-skin. This is **Tailwind v4** — design tokens live in `src/app/global.css` under `@theme inline` + `:root`/`.dark`, NOT in `tailwind.config.ts`. Rewriting tokens cascades to every shadcn/ui component automatically, so most tasks are structure/spacing/mono/icon/citation work, not recoloring. Existing data flow (Next 16, Zustand store, WebSocket) is untouched.

**Tech Stack:** Next.js 16 (App + Pages router mix), React 19, Tailwind CSS v4, shadcn/ui, framer-motion/motion, lucide-react, next-themes, react-markdown, zustand.

**Verification note:** This is a visual redesign — there are no meaningful unit tests. Each task verifies via: (a) `npm run lint`, (b) `npm run build` (TypeScript + Next build), and (c) a dev-server visual check (`npm run dev` → look at the described screen). "Expected" describes what you should see.

**Conventions (apply to every task):**
- Icons: `lucide-react` only. No emojis anywhere. Stroke width 1.5–2, sizes 16/20/24.
- Marigold (`--primary`) only on: active focus, citations, focus rings, primary CTAs, streaming pulse. Nowhere else.
- All spacing from the 4px scale; all font sizes from the type ramp utilities (`text-display/h1/h2/h3/body/sm/meta/micro`).
- Commit after each task. Do NOT add a `Co-Authored-By: Claude` trailer — commits carry the user's name only.

**Spec:** `docs/superpowers/specs/2026-06-13-rag-tutor-redesign-design.md`

---

## File Structure

**Foundation:**
- `src/app/global.css` — token rewrite (warm dark + paper), type ramp, motion tokens, retuned utilities, warm scrollbar. *Source of truth for the design system.*
- `src/app/layout.tsx` — default theme → `dark`.
- `src/config/themes.ts` — two real themes.
- `src/components/theme/ThemeSwitcher.tsx` — 2-mode toggle (re-enabled).

**New shared primitives:**
- `src/lib/citations.ts` — `parseCitations()` util + `Citation`/`Source` types.
- `src/components/dashboard/ContentPanel/Citation.tsx` — inline citation chip.
- `src/components/dashboard/ContentPanel/SourcesRail.tsx` — per-answer sources rail.

**Re-skinned surfaces (structure/spacing/mono/icons):**
- Dashboard: `Header/Header.tsx`, `SideBar/NotebookSidebar.tsx` + `Subject/SubjectItem.tsx` + `Chapter/ChapterItem.tsx`, `ContentPanel/ChatView.tsx` + `EmptyState.tsx` + `ProcessingState.tsx` + `AddSourceView.tsx`, `StudioPanel/StudioPanel.tsx` + skeletons.
- Auth: `components/auth/LoginForm.tsx`, `RegisterForm.tsx` (router-agnostic).
- Landing: `src/app/page.tsx` (currently a redirect) + section components.

---

## Phase 0 — Foundation

### Task 1: Rewrite color tokens + fonts (warm dark + paper)

**Files:**
- Modify: `src/app/global.css` (the `@theme inline` font lines, `:root` block, `.dark` block)

- [ ] **Step 1: Point font tokens at the already-loaded Geist variables**

In `src/app/global.css`, inside `@theme inline`, replace:
```css
  --font-sans: Inter, sans-serif;
  --font-mono: JetBrains Mono, monospace;
```
with:
```css
  --font-sans: var(--font-geist-sans), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
```
(`--font-geist-sans` / `--font-geist-mono` are already injected by `layout.tsx`.)

- [ ] **Step 2: Replace `:root` (Paper / warm light) tokens**

Replace the entire `:root { ... }` block with:
```css
:root {
  /* Paper — warm light */
  --background: oklch(0.985 0.006 80);
  --foreground: oklch(0.22 0.02 60);
  --card: oklch(0.995 0.004 80);
  --card-foreground: oklch(0.22 0.02 60);
  --popover: oklch(0.995 0.004 80);
  --popover-foreground: oklch(0.22 0.02 60);
  --primary: oklch(0.70 0.16 65);            /* marigold (deeper for light contrast) */
  --primary-foreground: oklch(0.99 0.01 80);
  --secondary: oklch(0.95 0.008 80);
  --secondary-foreground: oklch(0.28 0.02 60);
  --muted: oklch(0.95 0.008 80);
  --muted-foreground: oklch(0.48 0.02 65);
  --accent: oklch(0.95 0.012 80);
  --accent-foreground: oklch(0.28 0.02 60);
  --destructive: oklch(0.58 0.16 30);
  --destructive-foreground: oklch(0.99 0.01 80);
  --border: oklch(0.90 0.008 80);
  --input: oklch(0.90 0.008 80);
  --ring: oklch(0.70 0.16 65);
  --radius: 0.625rem;
}
```

- [ ] **Step 3: Replace `.dark` (Warm espresso) tokens**

Replace the entire `.dark { ... }` block with:
```css
.dark {
  /* Warm Dark — espresso, brown undertone (NOT blue-black) */
  --background: oklch(0.16 0.012 60);
  --foreground: oklch(0.94 0.01 75);
  --card: oklch(0.19 0.014 60);
  --card-foreground: oklch(0.94 0.01 75);
  --popover: oklch(0.22 0.016 60);
  --popover-foreground: oklch(0.94 0.01 75);
  --primary: oklch(0.78 0.16 70);            /* marigold */
  --primary-foreground: oklch(0.20 0.03 60);
  --secondary: oklch(0.24 0.012 60);
  --secondary-foreground: oklch(0.94 0.01 75);
  --muted: oklch(0.24 0.012 60);
  --muted-foreground: oklch(0.68 0.02 70);
  --accent: oklch(0.24 0.014 60);
  --accent-foreground: oklch(0.94 0.01 75);
  --destructive: oklch(0.58 0.16 30);
  --destructive-foreground: oklch(0.96 0.01 75);
  --border: oklch(0.28 0.012 60);
  --input: oklch(0.30 0.012 60);
  --ring: oklch(0.78 0.16 70);
  --radius: 0.625rem;
}
```

- [ ] **Step 4: Verify**

Run: `npm run lint`
Then `npm run dev`, open `/dashboard` (or any screen) in dark mode.
Expected: lint passes; background is a warm espresso (visibly brown-tinted, not blue/slate); text is warm off-white; any primary buttons are marigold. Light mode is warm paper, not stark white.

- [ ] **Step 5: Commit**

```bash
git add src/app/global.css
git commit -m "feat(ui): warm-dark + paper token system with marigold accent"
```

---

### Task 2: Type ramp, motion tokens, retuned utilities, warm scrollbar

**Files:**
- Modify: `src/app/global.css`

- [ ] **Step 1: Add the type ramp + motion tokens to `@theme inline`**

Inside the `@theme inline { ... }` block (after the `--radius` line), add:
```css
  /* Type ramp (even steps, fixed line-heights) */
  --text-display: 3rem;        --text-display--line-height: 1.05;  --text-display--letter-spacing: -0.02em;
  --text-h1: 1.875rem;         --text-h1--line-height: 1.15;       --text-h1--letter-spacing: -0.01em;
  --text-h2: 1.375rem;         --text-h2--line-height: 1.25;
  --text-h3: 1.125rem;         --text-h3--line-height: 1.35;
  --text-body: 0.9375rem;      --text-body--line-height: 1.7;
  --text-sm: 0.8125rem;        --text-sm--line-height: 1.5;
  --text-meta: 0.75rem;        --text-meta--line-height: 1.4;
  --text-micro: 0.6875rem;     --text-micro--line-height: 1.4;

  /* Motion */
  --ease-out-soft: cubic-bezier(0.16, 1, 0.3, 1);
```

This generates `text-display`, `text-h1` … `text-micro` utilities in Tailwind v4.

- [ ] **Step 2: Retune the utility layer**

In the `@layer utilities` block, replace the `.glass` and `.gradient-active` rules with warm-tuned versions and add a motion duration helper:
```css
  .glass {
    @apply bg-background/70 backdrop-blur-md border-border/60 supports-[backdrop-filter]:bg-background/60;
  }

  /* Active item: marigold left edge + subtle warm wash (NOT full border) */
  .gradient-active {
    @apply bg-primary/10 border-l-2 border-primary text-foreground font-medium;
  }

  .gradient-hover {
    @apply hover:bg-accent/60 transition-colors duration-150 ease-out;
  }

  .active-press {
    @apply active:scale-[0.97] transition-transform duration-100;
  }

  /* Motion defaults */
  .motion-base { transition: all 180ms var(--ease-out-soft); }
  .motion-fast { transition: all 120ms var(--ease-out-soft); }
```

- [ ] **Step 3: Warm the scrollbar**

In `@layer base`, the scrollbar thumb already uses `bg-muted-foreground/20` — leave the structure but confirm width stays `6px`. No change needed beyond what tokens already warm. (Skip if already warm.)

- [ ] **Step 4: Add reduced-motion guard**

At the end of the file, add:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 5: Verify**

Run: `npm run build`
Expected: build succeeds. In dev, a quick `<p className="text-body">` and `<span className="text-meta font-mono">` render at the new sizes (15px/1.7 and 12px mono). Active sidebar item (after Task 8) will show the marigold left edge.

- [ ] **Step 6: Commit**

```bash
git add src/app/global.css
git commit -m "feat(ui): add type ramp, motion tokens, warm utilities"
```

---

### Task 3: Two real themes + theme toggle

**Files:**
- Modify: `src/config/themes.ts`
- Modify: `src/components/theme/ThemeSwitcher.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace themes list**

`src/config/themes.ts` — full file:
```ts
export const themes = [
  { name: "dark",  color: "#1a1410" },  // warm espresso
  { name: "light", color: "#faf8f5" },  // warm paper
];
```

- [ ] **Step 2: Make ThemeSwitcher a 2-mode toggle with lucide icons**

`src/components/theme/ThemeSwitcher.tsx` — full file:
```tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="size-9" />;

  const isDark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      className="active-press"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Moon size={18} /> : <Sun size={18} />}
    </Button>
  );
}
```

- [ ] **Step 3: Default to dark**

In `src/app/layout.tsx`, change `defaultTheme="system"` to `defaultTheme="dark"` (keep `enableSystem` and `attribute="class"`).

- [ ] **Step 4: Verify**

Run: `npm run dev`, load the app.
Expected: app opens in warm dark by default; the toggle (wired into Header in Task 7) flips to warm paper and back with Sun/Moon icons. No hydration warning.

- [ ] **Step 5: Commit**

```bash
git add src/config/themes.ts src/components/theme/ThemeSwitcher.tsx src/app/layout.tsx
git commit -m "feat(ui): two-mode warm theme system with dark default"
```

---

## Phase 1 — Shared Primitives

### Task 4: Retune button & input radius / press / focus

**Files:**
- Modify: `src/components/ui/button.tsx:7-8,24-29`
- Modify: `src/components/ui/input.tsx:10-14`

Most coloring already inherits from tokens. This task only sharpens radius and press feedback.

- [ ] **Step 1: Button — add press scale + confirm radius**

In `src/components/ui/button.tsx`, in the base `cva` string (line 7-8), append `active-press` to the class list (after `transition-all`). Leave variants as-is (they already use `bg-primary`/`--ring`).

- [ ] **Step 2: Input — comfortable height + warm focus**

In `src/components/ui/input.tsx`, change the height from `h-9` to `h-10` and confirm the focus block reads:
```
"focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]"
```
(marigold ring now comes from the `--ring` token automatically).

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: builds. Buttons scale slightly on press; inputs show a marigold focus ring on focus.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/button.tsx src/components/ui/input.tsx
git commit -m "feat(ui): press feedback + marigold focus on button/input"
```

---

### Task 5: Citation parser util + types

**Files:**
- Create: `src/lib/citations.ts`

- [ ] **Step 1: Write the parser + types**

`src/lib/citations.ts` — full file:
```ts
// Splits assistant answer text into plain-text and citation segments.
// Supported syntaxes (in priority order):
//   1. Structured: [[cite:<sourceId>|<title>|<page>]]
//   2. Loose human form: [<Title> · p<page>]   e.g. [Attention Is All You Need · p12]
// Loose form degrades gracefully when the backend emits no structured metadata.

export interface Source {
  id: string;
  title: string;
  page?: string;
  snippet?: string;
}

export type Segment =
  | { type: "text"; value: string }
  | { type: "citation"; source: Source };

const STRUCTURED = /\[\[cite:([^|\]]+)\|([^|\]]+)\|([^\]]*)\]\]/g;
const LOOSE = /\[([^\]·]+?)\s*·\s*p\s*([0-9]+)\]/g;

export function parseCitations(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  // First pass: structured citations.
  const combined: { index: number; length: number; source: Source }[] = [];
  for (const m of text.matchAll(STRUCTURED)) {
    combined.push({
      index: m.index!,
      length: m[0].length,
      source: { id: m[1].trim(), title: m[2].trim(), page: m[3].trim() || undefined },
    });
  }
  if (combined.length === 0) {
    for (const m of text.matchAll(LOOSE)) {
      const title = m[1].trim();
      combined.push({
        index: m.index!,
        length: m[0].length,
        source: { id: `${title}-p${m[2]}`, title, page: m[2] },
      });
    }
  }
  combined.sort((a, b) => a.index - b.index);

  for (const c of combined) {
    if (c.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, c.index) });
    }
    segments.push({ type: "citation", source: c.source });
    lastIndex = c.index + c.length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }
  return segments;
}
```

- [ ] **Step 2: Quick sanity check (manual, via node)**

Run:
```bash
npx tsx -e "import {parseCitations} from './src/lib/citations'; console.log(JSON.stringify(parseCitations('Tokens relate via attention. [Attention Is All You Need · p12] Done.'),null,2))"
```
Expected: three segments — text, citation (`title: \"Attention Is All You Need\"`, `page: \"12\"`), text. (If `tsx` is unavailable, skip — covered by the build + visual check in Task 7-equivalent.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/citations.ts
git commit -m "feat(chat): citation parser with structured + loose syntax"
```

---

### Task 6: Citation chip + SourcesRail components

**Files:**
- Create: `src/components/dashboard/ContentPanel/Citation.tsx`
- Create: `src/components/dashboard/ContentPanel/SourcesRail.tsx`

- [ ] **Step 1: Citation chip**

`src/components/dashboard/ContentPanel/Citation.tsx` — full file:
```tsx
"use client";

import { motion } from "motion/react";
import { FileText } from "lucide-react";
import type { Source } from "@/lib/citations";
import { cn } from "@/lib/utils";

interface CitationProps {
  source: Source;
  active?: boolean;
  onActivate?: (id: string) => void;
  onHover?: (id: string | null) => void;
}

export function Citation({ source, active, onActivate, onHover }: CitationProps) {
  const label =
    source.title.length > 24 ? source.title.slice(0, 23) + "…" : source.title;
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onActivate?.(source.id)}
      onMouseEnter={() => onHover?.(source.id)}
      onMouseLeave={() => onHover?.(null)}
      title={source.title}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 mx-0.5 align-baseline",
        "font-mono text-meta leading-none transition-all duration-120",
        "border-primary/30 bg-primary/10 text-primary hover:-translate-y-px hover:bg-primary/15 hover:border-primary/50",
        active && "bg-primary/20 border-primary/60 -translate-y-px",
      )}
    >
      <FileText size={11} className="opacity-70" />
      {label}
      {source.page ? <span className="opacity-60">· p{source.page}</span> : null}
    </motion.button>
  );
}
```

- [ ] **Step 2: Sources rail**

`src/components/dashboard/ContentPanel/SourcesRail.tsx` — full file:
```tsx
"use client";

import type { Source } from "@/lib/citations";
import { cn } from "@/lib/utils";

interface SourcesRailProps {
  sources: Source[];
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
}

export function SourcesRail({ sources, hoveredId, onHover }: SourcesRailProps) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-4 pt-3 border-t border-border/60">
      <p className="font-mono text-micro text-muted-foreground mb-2">
        // {sources.length} source{sources.length === 1 ? "" : "s"}
      </p>
      <div className="flex flex-col gap-1.5">
        {sources.map((s) => (
          <div
            key={s.id}
            onMouseEnter={() => onHover?.(s.id)}
            onMouseLeave={() => onHover?.(null)}
            className={cn(
              "rounded-md border border-border/60 bg-card px-3 py-2 transition-colors duration-120",
              hoveredId === s.id && "border-primary/50 bg-primary/5",
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm text-foreground truncate">{s.title}</span>
              {s.page ? (
                <span className="font-mono text-micro text-muted-foreground shrink-0">
                  p{s.page}
                </span>
              ) : null}
            </div>
            {s.snippet ? (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {s.snippet}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: builds with no type errors (imports of `Source`, `motion/react`, `lucide-react` resolve). Visual wiring happens in Task 9.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/ContentPanel/Citation.tsx src/components/dashboard/ContentPanel/SourcesRail.tsx
git commit -m "feat(chat): citation chip + bidirectional sources rail"
```

---

## Phase 2 — Dashboard

### Task 7: Header reskin (slim, mono, lucide, theme toggle)

**Files:**
- Modify: `src/components/dashboard/Header/Header.tsx`

- [ ] **Step 1: Rewrite the header**

`src/components/dashboard/Header/Header.tsx` — full file:
```tsx
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { clearTokens, getUser } from "@/utils/storage";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { BookOpen, LogOut } from "lucide-react";

export function Header() {
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    clearTokens();
    router.push("/auth/login");
  };

  return (
    <header className="glass sticky top-0 z-50 flex items-center justify-between border-b px-4 h-12">
      <div className="flex items-center gap-2">
        <BookOpen size={18} className="text-primary" />
        <span className="text-h3 font-semibold tracking-tight">StudyWise</span>
        <span className="font-mono text-micro text-muted-foreground ml-1">
          // tutor
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground hidden sm:inline mr-2">
          {user?.name || "User"}
        </span>
        <ThemeSwitcher />
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="icon"
          aria-label="Log out"
          className="active-press text-muted-foreground hover:text-foreground"
        >
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run dev`, load `/dashboard`.
Expected: slim 48px warm-glass header; marigold book icon; "StudyWise // tutor" with mono kicker; working Sun/Moon theme toggle; logout icon. No emojis.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/Header/Header.tsx
git commit -m "feat(ui): slim warm header with mono kicker and theme toggle"
```

---

### Task 8: Sidebar reskin (Obsidian-dense tree, mono numbers, marigold active)

**Files:**
- Modify: `src/components/dashboard/SideBar/NotebookSidebar.tsx`
- Modify: `src/components/dashboard/SideBar/Subject/SubjectItem.tsx`
- Modify: `src/components/dashboard/SideBar/Chapter/ChapterItem.tsx`

> Read each file first; preserve all store hooks, props, click handlers, and modal triggers. Change only presentation (wrapper classes, icons, spacing, mono numbering, active state).

- [ ] **Step 1: NotebookSidebar shell**

In `NotebookSidebar.tsx`, set the root container to `flex flex-col h-full bg-background border-r border-border/60`. Section headers (e.g. "Subjects") become: `font-mono text-micro uppercase tracking-wider text-muted-foreground px-3 py-2`. Replace any emoji/inline-SVG add buttons with lucide `Plus` (`size={16}`) in a `ghost` `icon` button. Row gaps use the 4px scale (`gap-0.5` between rows, `px-2` list padding).

- [ ] **Step 2: SubjectItem**

In `SubjectItem.tsx`: the subject row uses `gradient-hover rounded-md px-2 py-1.5 text-sm` and a lucide `ChevronRight`/`ChevronDown` (`size={14}`) for expand state + `Folder` (`size={16}`) icon. Keep existing expand/collapse and selection logic.

- [ ] **Step 3: ChapterItem with mono numbering + marigold active**

In `ChapterItem.tsx`, the chapter row:
```tsx
// className for the row button (preserve existing onClick / active prop):
className={cn(
  "group flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm gradient-hover active-press",
  isActive && "gradient-active",
)}
```
Prefix the chapter name with a mono index when available:
```tsx
<span className="font-mono text-micro text-muted-foreground w-6 shrink-0 text-right">
  {String(index + 1).padStart(2, "0")}
</span>
<span className="truncate">{chapter.name}</span>
```
(Use whatever index/active variable the component already has; if no index is in scope, omit the number rather than inventing data.)

- [ ] **Step 4: Verify**

Run: `npm run dev`, open `/dashboard`.
Expected: dense, calm subject→chapter tree; mono chapter numbers (`01`, `02`); hover gives a warm wash; the active chapter shows a **marigold left edge + subtle warm wash**; lucide chevrons/folder/plus icons; no emojis.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/SideBar
git commit -m "feat(ui): obsidian-dense sidebar with mono numbering + marigold active"
```

---

### Task 9: ChatView reskin + citation integration + streaming + empty state

**Files:**
- Modify: `src/components/dashboard/ContentPanel/ChatView.tsx`
- Modify: `src/components/dashboard/ContentPanel/EmptyState.tsx`

> Preserve ALL store hooks (`sendMessage`, `isAiResponding`, `messages`, pagination), the scroll-to-bottom effect, and the submit handler. Replace icons with lucide, restructure message rendering, and integrate citations.

- [ ] **Step 1: Swap inline SVG icons for lucide**

At the top of `ChatView.tsx`, delete the hand-rolled `SendIcon`/`UserIcon`/`BotIcon` SVG components and import:
```tsx
import { Send, User, Sparkles } from "lucide-react";
```
Use `<Send size={18} />` in the send button, `<User size={16} />` for user, `<Sparkles size={16} />` for the assistant.

- [ ] **Step 2: Add citation state + render assistant text through the parser**

Add hover-link state near the other hooks:
```tsx
const [hoveredSource, setHoveredSource] = useState<string | null>(null);
```
Add imports:
```tsx
import { parseCitations, type Source } from "@/lib/citations";
import { Citation } from "./Citation";
import { SourcesRail } from "./SourcesRail";
```
Create a renderer that turns assistant text into markdown + inline citation chips. Place above the component:
```tsx
function AssistantContent({
  text,
  hoveredSource,
  setHoveredSource,
}: {
  text: string;
  hoveredSource: string | null;
  setHoveredSource: (id: string | null) => void;
}) {
  const segments = parseCitations(text);
  const sources: Source[] = segments
    .filter((s) => s.type === "citation")
    .map((s) => (s as Extract<typeof s, { type: "citation" }>).source)
    .filter((src, i, arr) => arr.findIndex((x) => x.id === src.id) === i);

  return (
    <div className="text-body text-foreground max-w-[70ch]">
      <p className="whitespace-pre-wrap">
        {segments.map((seg, i) =>
          seg.type === "text" ? (
            <span key={i}>{seg.value}</span>
          ) : (
            <Citation
              key={i}
              source={seg.source}
              active={hoveredSource === seg.source.id}
              onHover={setHoveredSource}
            />
          ),
        )}
      </p>
      <SourcesRail
        sources={sources}
        hoveredId={hoveredSource}
        onHover={setHoveredSource}
      />
    </div>
  );
}
```
> Note: this renders assistant text as plain text + chips rather than full markdown, so citation chips can be interleaved. If rich markdown (lists/bold) must be preserved, render `ReactMarkdown` on each `text` segment instead of the `<span>`; keep the `Citation` branch unchanged. Choose markdown-per-segment only if answers rely on markdown formatting.

- [ ] **Step 3: Restructure message rows (document feel, not chat bubbles)**

Replace the message `.map(...)` body so assistant and user read as a calm document:
```tsx
{messages.map((msg) => (
  <div
    key={msg.id}
    className="flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-200"
  >
    <div className={cn(
      "shrink-0 mt-0.5 size-7 rounded-md flex items-center justify-center",
      msg.sender === "user" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
    )}>
      {msg.sender === "user" ? <User size={16} /> : <Sparkles size={16} />}
    </div>
    <div className="flex-1 min-w-0">
      {msg.sender === "user" ? (
        <p className="text-body text-foreground max-w-[70ch]">{msg.text}</p>
      ) : (
        <AssistantContent
          text={msg.text}
          hoveredSource={hoveredSource}
          setHoveredSource={setHoveredSource}
        />
      )}
    </div>
  </div>
))}
```
Outer list spacing: `className="px-6 py-6 space-y-8"`.

- [ ] **Step 4: Calm streaming indicator (marigold pulse + mono)**

Replace the 3-dot bounce block with:
```tsx
{isAiResponding && (
  <div className="flex gap-3">
    <div className="shrink-0 mt-0.5 size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
      <Sparkles size={16} />
    </div>
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="size-1.5 rounded-full bg-primary animate-pulse" />
      <span className="font-mono text-meta">// thinking</span>
    </div>
  </div>
)}
```

- [ ] **Step 5: Panel header + input polish**

Panel header: `text-h3` chapter name + mono sources line:
```tsx
<p className="font-mono text-micro text-muted-foreground">
  // {chapter.documents.length} source{chapter.documents.length === 1 ? "" : "s"}
</p>
```
Input footer disclaimer uses `text-micro text-muted-foreground/70`. Keep the `Send` button marigold (default variant). Input wrapper border `border-t border-border/60`.

- [ ] **Step 6: Intentional empty state**

`EmptyState.tsx` — render a centered, calm prompt with lucide `Sparkles` (`size={28}`, `text-primary/70`), a `text-h3` line ("Ask anything about this chapter"), a `text-sm text-muted-foreground` subline, and 3 suggestion chips (`font-mono text-meta border border-border rounded-full px-3 py-1`). No emoji. (Preserve any existing props; if it currently lives inline in ChatView, route the `messages.length === 0` branch to render it.)

- [ ] **Step 7: Verify**

Run: `npm run dev`, open a chapter, send a message that returns text containing `[Some Title · p3]` (or use a stub answer).
Expected: assistant answer reads as a calm document at 15px/1.7, max ~70ch; the citation renders as a marigold mono chip that fades+scales in; hovering the chip highlights its card in the sources rail and vice-versa; streaming shows a marigold pulse + `// thinking`; empty state is intentional. No emojis, no chat bubbles.

- [ ] **Step 8: Commit**

```bash
git add src/components/dashboard/ContentPanel/ChatView.tsx src/components/dashboard/ContentPanel/EmptyState.tsx
git commit -m "feat(chat): document-style answers with citation chips + sources rail"
```

---

### Task 10: Studio panel + skeletons (warm cards, mono counts)

**Files:**
- Modify: `src/components/dashboard/StudioPanel/StudioPanel.tsx`
- Modify: `src/components/dashboard/StudioPanel/FlashCards.tsx`
- Modify: `src/components/dashboard/StudioPanel/FlashcardSkeleton.tsx`
- Modify: `src/components/dashboard/StudioPanel/QuestionsSkeleton.tsx`
- Modify: `src/components/dashboard/ContentPanel/ChatSkeleton.tsx`

> Preserve all generation logic and store hooks. Presentation only.

- [ ] **Step 1: Panel + section headers**

In `StudioPanel.tsx`, root `flex flex-col h-full bg-background border-l border-border/60`. Section titles become mono uppercase micro labels (`font-mono text-micro uppercase tracking-wider text-muted-foreground`). Counts render mono: `<span className="font-mono text-meta text-muted-foreground">12 cards · 4 quiz</span>` (use real counts from props/store; omit a count if not available).

- [ ] **Step 2: Cards**

Flashcards/quiz cards use `rounded-lg border border-border/60 bg-card p-4 shadow-sm motion-base hover:border-border`. Replace any emoji/inline icons with lucide (`Layers` for cards, `HelpCircle` for quiz, `RotateCw` for flip).

- [ ] **Step 3: Warm skeletons**

In each skeleton file, ensure shimmer uses `bg-muted` (now warm) with `animate-pulse`; remove any cool-gray hardcoded colors (e.g. `bg-gray-*`, `bg-slate-*`) in favor of `bg-muted` / `bg-card`.

- [ ] **Step 4: Verify**

Run: `npm run dev`, open a chapter with studio content (or trigger generation).
Expected: studio cards are warm, elevation-based, with mono counts; loading skeletons pulse warm (not cool gray); lucide icons; no emojis.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/StudioPanel src/components/dashboard/ContentPanel/ChatSkeleton.tsx
git commit -m "feat(ui): warm studio cards + skeletons with mono counts"
```

---

### Task 11: Processing / Add-source states reskin

**Files:**
- Modify: `src/components/dashboard/ContentPanel/ProcessingState.tsx`
- Modify: `src/components/dashboard/ContentPanel/AddSourceView.tsx`

> Preserve all ingestion pipeline logic, WebSocket-driven state, and upload handlers. Presentation only.

- [ ] **Step 1: Engineered processing state**

In `ProcessingState.tsx`, present pipeline stages as a mono step list: each stage label `font-mono text-meta`, completed stages get a lucide `Check` (`size={14} className="text-primary"`), the active stage a marigold `Loader2` (`size={14} className="text-primary animate-spin"`), pending stages `text-muted-foreground`. Keep stage data from existing props/state.

- [ ] **Step 2: Add-source view**

In `AddSourceView.tsx`, the dropzone/upload area uses `rounded-lg border border-dashed border-border hover:border-primary/50 motion-base p-8`, lucide `Upload` (`size={24} className="text-muted-foreground"`), `text-sm` instructions, mono `text-micro` accepted-types hint. Replace any emoji.

- [ ] **Step 3: Verify**

Run: `npm run dev`, trigger an upload / ingestion.
Expected: processing reads as an engineered mono step list with a marigold spinner on the active stage and marigold checks on completed ones; upload area is a warm dashed dropzone with lucide icons. Pipeline still functions. No emojis.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/ContentPanel/ProcessingState.tsx src/components/dashboard/ContentPanel/AddSourceView.tsx
git commit -m "feat(ui): engineered processing + warm add-source states"
```

---

## Phase 3 — Auth

### Task 12: Login / Register split-screen reskin

**Files:**
- Modify: `src/components/auth/LoginForm.tsx`
- Modify: `src/components/auth/RegisterForm.tsx`

> Preserve react-hook-form/zod setup, submit handlers, Google OAuth logic, and routing. Change layout + styling only. (The forms render inside the existing `src/pages/auth/*` routes — confirm the route file wraps the form in a full-height container; if not, add `min-h-screen` there.)

- [ ] **Step 1: Shared split-screen layout**

Wrap each form's returned JSX in a two-column shell (the form lives in the right/left content column, brand panel on the other side):
```tsx
<div className="min-h-screen grid lg:grid-cols-2">
  {/* Brand panel — warm dark, one ambient marigold accent */}
  <div className="hidden lg:flex flex-col justify-between bg-background p-12 border-r border-border/60 relative overflow-hidden">
    <div className="flex items-center gap-2">
      <BookOpen size={20} className="text-primary" />
      <span className="text-h3 font-semibold">StudyWise</span>
    </div>
    <div className="relative z-10">
      <p className="font-mono text-micro text-muted-foreground mb-3">// retrieval-augmented tutor</p>
      <h2 className="text-h1 max-w-sm leading-tight">
        Ask your sources. Get answers that cite their work.
      </h2>
    </div>
    <div className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
    <span />
  </div>
  {/* Form column */}
  <div className="flex items-center justify-center p-6">
    <div className="w-full max-w-sm">
      {/* existing heading + form fields go here */}
    </div>
  </div>
</div>
```
Add `import { BookOpen } from "lucide-react";`.

- [ ] **Step 2: Field + error polish**

Labels above inputs (`text-sm font-medium mb-1.5`). Inputs inherit the marigold focus ring from Task 4. Error messages: `text-sm text-destructive mt-1` (calm, warm — no full-width red banners). Submit button is the default marigold `Button` at `w-full`.

- [ ] **Step 3: Google OAuth button restyle**

Style the Google button as `variant="outline"` with a lucide-rendered or inline Google glyph + `text-sm`, neutral surface, hairline border — not default blue. Keep the existing `@react-oauth/google` / next-auth handler.

- [ ] **Step 4: Verify**

Run: `npm run dev`, open `/auth/login` and `/auth/register`.
Expected: split screen — warm-dark brand panel with one soft marigold glow + mono kicker on one side, the form on the other; inputs show marigold focus rings; errors are calm; Google button matches the theme; coherent with the rest of the app.

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/LoginForm.tsx src/components/auth/RegisterForm.tsx
git commit -m "feat(auth): split-screen warm auth with marigold accents"
```

---

## Phase 4 — Landing

### Task 13: Landing page

**Files:**
- Create: `src/app/(marketing)/page.tsx` OR replace `src/app/page.tsx`
- Create: `src/components/landing/Hero.tsx`
- Create: `src/components/landing/CapabilityBlocks.tsx`

> Currently `src/app/page.tsx` redirects to `/auth/login`. Replace the redirect with the landing page; keep "Get started" → `/auth/register` and "Sign in" → `/auth/login`.

- [ ] **Step 1: Replace the redirect page**

`src/app/page.tsx` — full file:
```tsx
import { Hero } from "@/components/landing/Hero";
import { CapabilityBlocks } from "@/components/landing/CapabilityBlocks";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <CapabilityBlocks />
      <footer className="border-t border-border/60 px-6 py-8 text-center">
        <p className="font-mono text-micro text-muted-foreground">
          // StudyWise — retrieval-augmented tutor
        </p>
      </footer>
    </main>
  );
}
```

- [ ] **Step 2: Hero**

`src/components/landing/Hero.tsx` — full file:
```tsx
import Link from "next/link";
import { BookOpen, ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <header className="flex items-center justify-between px-6 h-14 border-b border-border/60">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-primary" />
          <span className="text-h3 font-semibold">StudyWise</span>
        </div>
        <Link href="/auth/login">
          <Button variant="ghost" size="sm">Sign in</Button>
        </Link>
      </header>

      <div className="grid lg:grid-cols-2 gap-12 px-6 py-20 max-w-6xl mx-auto items-center">
        <div>
          <p className="font-mono text-micro text-muted-foreground mb-4">
            // retrieval-augmented tutor
          </p>
          <h1 className="text-display font-semibold tracking-tight mb-5">
            Study from your sources. Answers that cite their work.
          </h1>
          <p className="text-body text-muted-foreground max-w-md mb-8">
            Upload your material, ask anything, and get precise answers grounded
            in the page they came from — then turn them into flashcards and quizzes.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/auth/register">
              <Button className="active-press gap-2">
                Get started <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
          </div>
        </div>

        {/* Product vignette */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-lg">
          <p className="text-body mb-3">
            Transformers use self-attention to model relationships between tokens.
            <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 text-primary font-mono text-meta px-1.5 py-0.5 mx-1 align-baseline">
              <FileText size={11} className="opacity-70" />
              Attention Is All You Need · p12
            </span>
          </p>
          <div className="mt-4 pt-3 border-t border-border/60">
            <p className="font-mono text-micro text-muted-foreground">// 1 source</p>
          </div>
        </div>
      </div>

      <div className="absolute -right-32 top-20 size-96 rounded-full bg-primary/10 blur-3xl -z-10" />
    </section>
  );
}
```

- [ ] **Step 3: Capability blocks**

`src/components/landing/CapabilityBlocks.tsx` — full file:
```tsx
import { Upload, MessageSquareQuote, GraduationCap } from "lucide-react";

const blocks = [
  { icon: Upload, kicker: "// ingest", title: "Add your sources", body: "Upload documents and we index them for retrieval." },
  { icon: MessageSquareQuote, kicker: "// ask", title: "Cited answers", body: "Every answer links back to the exact page it came from." },
  { icon: GraduationCap, kicker: "// study", title: "Flashcards & quizzes", body: "Turn any chapter into active-recall practice." },
];

export function CapabilityBlocks() {
  return (
    <section className="px-6 py-20 max-w-5xl mx-auto">
      <div className="grid md:grid-cols-3 gap-5">
        {blocks.map((b) => (
          <div key={b.title} className="rounded-xl border border-border/60 bg-card p-6 motion-base hover:border-border">
            <b.icon size={20} className="text-primary mb-4" />
            <p className="font-mono text-micro text-muted-foreground mb-1">{b.kicker}</p>
            <h3 className="text-h3 font-semibold mb-2">{b.title}</h3>
            <p className="text-sm text-muted-foreground">{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run dev`, open `/`.
Expected: warm-dark hero with mono kicker, display headline, single marigold CTA, and a product vignette showing the marigold citation chip; three capability blocks with lucide icons + mono kickers; warm footer. Reads as one product with the dashboard. No emojis.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/landing
git commit -m "feat(landing): focused warm landing page with product vignette"
```

---

## Final verification

- [ ] Run `npm run build` — succeeds with no type errors.
- [ ] Run `npm run lint` — clean.
- [ ] Dark mode is warm espresso everywhere; no pure `#000`/`#fff`; no blue/slate.
- [ ] Search the diff for marigold uses — each is on the allow-list (active/citation/focus/CTA/pulse).
- [ ] Grep for emojis in `src/` — none in UI/copy. All icons are `lucide-react`.
- [ ] Citation chip streams in, links bidirectionally to the sources rail.
- [ ] Landing, auth, dashboard feel like one product.
- [ ] Existing flows still work: chat, ingestion, flashcards, quiz, auth.

## Self-review notes (resolved)
- **Spec §3 font assumption:** resolved — Geist sans/mono already loaded in `layout.tsx`; Task 1 just points tokens at them. No new font install.
- **Spec §6 citation degradation:** handled — `parseCitations` loose-form regex styles `[Title · pN]` even without backend metadata (Task 5/9).
- **Spec §8 auth router ambiguity:** flagged in Task 12 — forms are router-agnostic; confirm the active `src/pages/auth/*` route wraps the form full-height.
- **Tailwind v4 correction:** type ramp/motion tokens go in `global.css @theme`, not `tailwind.config.ts` (Task 2).
