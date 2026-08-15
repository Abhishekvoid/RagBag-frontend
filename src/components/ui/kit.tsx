"use client";

/* =============================================================================
   StudyWise Design Kit  —  reusable branded building blocks
   -----------------------------------------------------------------------------
   Palette: Charcoal / Olive (tokens live in app/global.css).
   Import from anywhere:  import { GlassCard, PrimaryButton, Field } from "@/components/ui/kit";
   Marketing / auth  = cinematic (Grain + Aurora + glow).
   Dashboard         = calm (GlassCard as accents, flat readable surfaces).
   ============================================================================= */

import * as React from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- atmosphere */

/** Fixed film-grain overlay. Drop once inside a cinematic (dark) surface. */
export function Grain() {
  return <div className="grain" aria-hidden />;
}

/** Soft olive aurora glow. Position inside a `relative` container. */
export function Aurora({ className }: { className?: string }) {
  return <div className={cn("aurora", className)} aria-hidden />;
}

/**
 * Olive glow that follows the cursor, smoothed with GSAP `quickTo` (runs off the
 * React render loop). Collapses to static under prefers-reduced-motion.
 */
export function CursorGlow({ size = 560 }: { size?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  React.useEffect(() => {
    const el = ref.current;
    if (reduce || !el) return;
    const half = size / 2;
    const xTo = gsap.quickTo(el, "x", { duration: 0.55, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.55, ease: "power3" });
    const onMove = (e: PointerEvent) => {
      xTo(e.clientX - half);
      yTo(e.clientY - half);
    };
    gsap.set(el, { x: window.innerWidth / 2 - half, y: window.innerHeight / 2 - half });
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, size]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-0"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle, rgba(var(--glow) / .22), transparent 62%)",
        filter: "blur(24px)",
        willChange: "transform",
      }}
    />
  );
}

/**
 * Full-screen cinematic shell for auth / marketing.
 * Forces the dark charcoal canvas regardless of the user's theme.
 */
export function CinematicShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("dark relative min-h-[100dvh] overflow-hidden bg-background text-foreground", className)}>
      <Aurora />
      <Grain />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------- brand */

export function StudyMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-6 rounded-[8px] bg-gradient-to-br from-primary to-[color-mix(in_srgb,var(--primary)_55%,#000)]",
        "shadow-[0_6px_20px_rgba(var(--glow)/.35),inset_0_1px_0_rgba(255,255,255,.35)]",
        className,
      )}
      aria-hidden
    />
  );
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight", className)}>
      <StudyMark />
      <span className="pencil">StudyWise</span>
    </span>
  );
}

/* ------------------------------------------------------------------- labels */

/** Small mono uppercase label. Use sparingly (max ~1 per few sections). */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground", className)}>
      {children}
    </span>
  );
}

/** Olive status pill with a pulsing dot, e.g. "Model ready". */
export function StatusPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-border bg-white/[.03] px-3.5 py-1.5",
        "font-mono text-[11px] uppercase tracking-[0.13em] text-muted-foreground",
        className,
      )}
    >
      <span className="size-[7px] rounded-full bg-primary olive-pulse" />
      {children}
    </span>
  );
}

/** Olive citation chip, e.g. <CitationPill>Ch.4 · p.118</CitationPill>. */
export function CitationPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "ml-1 inline-flex items-center rounded-md border px-1.5 py-0.5 align-middle font-mono text-[11px] text-primary",
        "border-primary/30 bg-primary/[.08]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- containers */

/** Frosted glass panel. Cinematic by default; pass `flat` for the calm dashboard. */
export function GlassCard({
  children,
  className,
  flat = false,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { flat?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6",
        flat ? "border border-border bg-card" : "glass-panel",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ buttons */

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Cursor-aware directional fill. A darker-olive layer wipes in from the exact
 * edge the pointer enters, and out the edge it leaves. No glow. Runs by mutating
 * the fill node directly (no React re-renders); collapses under reduced motion.
 */
function useDirectionalFill() {
  const fillRef = React.useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();

  const edge = (e: React.PointerEvent<HTMLElement>, rect: DOMRect) => {
    const l = Math.abs(e.clientX - rect.left);
    const r = Math.abs(e.clientX - rect.right);
    const t = Math.abs(e.clientY - rect.top);
    const b = Math.abs(e.clientY - rect.bottom);
    const min = Math.min(l, r, t, b);
    if (min === l) return "translateX(-101%)";
    if (min === r) return "translateX(101%)";
    if (min === t) return "translateY(-101%)";
    return "translateY(101%)";
  };

  const onPointerEnter = (e: React.PointerEvent<HTMLElement>) => {
    const el = fillRef.current;
    if (!el || reduce) return;
    el.style.transition = "none";
    el.style.transform = edge(e, e.currentTarget.getBoundingClientRect());
    void el.offsetWidth; // force reflow so the next transform animates
    el.style.transition = "transform .45s cubic-bezier(.16,1,.3,1)";
    el.style.transform = "translate(0,0)";
  };

  const onPointerLeave = (e: React.PointerEvent<HTMLElement>) => {
    const el = fillRef.current;
    if (!el || reduce) return;
    el.style.transition = "transform .45s cubic-bezier(.16,1,.3,1)";
    el.style.transform = edge(e, e.currentTarget.getBoundingClientRect());
  };

  return { fillRef, onPointerEnter, onPointerLeave };
}

const FILL_STYLE: React.CSSProperties = {
  background: "color-mix(in srgb, var(--primary) 60%, #000)",
  transform: "translateX(-101%)",
};

/** Primary vermillion CTA with a cursor-aware directional fill on hover (no glow). */
export function PrimaryButton({ className, children, ...props }: BtnProps) {
  const { fillRef, onPointerEnter, onPointerLeave } = useDirectionalFill();
  return (
    <button
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={cn(
        "relative isolate inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl px-6 text-[15px] font-semibold",
        "bg-primary text-primary-foreground active-press disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <span ref={fillRef} aria-hidden className="absolute inset-0 z-0" style={FILL_STYLE} />
      <span className="relative z-[1] inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

/** Glass ghost button (secondary action on cinematic surfaces). */
export function GhostButton({ className, children, ...props }: BtnProps) {
  return (
    <button
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white/[.03] px-6",
        "text-[15px] font-semibold text-foreground backdrop-blur-md transition-colors hover:bg-white/[.07] active-press",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Magnetic CTA — pulls toward the cursor. Drives motion values (not React state),
 * collapses to a static PrimaryButton under prefers-reduced-motion.
 */
export function MagneticButton({ className, children, ...props }: BtnProps) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18 });
  const sy = useSpring(y, { stiffness: 200, damping: 18 });
  const { fillRef, onPointerEnter, onPointerLeave } = useDirectionalFill();

  if (reduce) return <PrimaryButton className={className} {...props}>{children}</PrimaryButton>;

  return (
    <motion.button
      style={{ x: sx, y: sy }}
      onPointerEnter={onPointerEnter}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.25);
        y.set((e.clientY - r.top - r.height / 2) * 0.35);
      }}
      onPointerLeave={(e) => { x.set(0); y.set(0); onPointerLeave(e); }}
      className={cn(
        "relative isolate inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl px-6 text-[15px] font-semibold",
        "bg-primary text-primary-foreground active-press",
        className,
      )}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      <span ref={fillRef} aria-hidden className="absolute inset-0 z-0" style={FILL_STYLE} />
      <span className="relative z-[1] inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

/* -------------------------------------------------------------------- forms */

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

/** Label-above input with olive focus ring + password reveal. RHF-ready (forwardRef). */
export const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, className, id, type = "text", ...props },
  ref,
) {
  const [reveal, setReveal] = React.useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (reveal ? "text" : "password") : type;
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-[13px] font-medium text-foreground/80">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          aria-invalid={!!error}
          className={cn(
            "h-11 w-full rounded-xl border bg-background px-3.5 text-[14.5px] text-foreground placeholder:text-muted-foreground/60",
            "outline-none transition-[border-color,box-shadow] duration-200",
            "focus:border-primary focus:shadow-[0_0_0_3px_rgba(var(--glow)/.16)]",
            isPassword && "pr-11",
            error ? "border-destructive" : "border-input",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
          >
            {reveal ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {error && <p className="text-[13px] text-destructive">{error}</p>}
    </div>
  );
});

/* -------------------------------------------------------------- auth shell */

type AuthShellProps = {
  /** eyebrow above the big heading on the colored panel */
  sideEyebrow?: string;
  /** big heading on the colored panel */
  sideTitle: React.ReactNode;
  /** optional bullet points under the side heading */
  sidePoints?: string[];
  /** form-panel heading */
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * Centered two-panel auth card: olive gradient panel + clean form panel.
 * Forces the dark charcoal canvas regardless of theme.
 */
export function AuthShell({
  sideEyebrow,
  sideTitle,
  sidePoints,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  const reduce = useReducedMotion();
  const rotX = useSpring(0, { stiffness: 150, damping: 16 });
  const rotY = useSpring(0, { stiffness: 150, damping: 16 });

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rotY.set(px * 5);
    rotX.set(-py * 5);
  };
  const handleLeave = () => {
    rotX.set(0);
    rotY.set(0);
  };

  return (
    <div className="dark relative grid min-h-[100dvh] place-items-center overflow-hidden bg-background p-4 sm:p-6">
      <CursorGlow />
      <Aurora />
      <Grain />
      <div
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        className="relative z-10 w-full max-w-[980px] [perspective:1400px]"
      >
        <motion.div
          style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
          className="grid rounded-[28px] border border-border bg-card p-2.5 shadow-[0_50px_120px_-40px_rgba(0,0,0,.8)] lg:grid-cols-2 lg:gap-3 lg:p-3"
        >
        {/* colored panel — inset, framed by the dark card shade */}
        <div className="relative hidden min-h-[560px] flex-col justify-between overflow-hidden rounded-2xl p-9 lg:flex">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 120% at 0% 0%, var(--primary) 0%, transparent 48%)," +
                "radial-gradient(130% 130% at 100% 100%, color-mix(in srgb, var(--primary) 60%, #1a0d10) 0%, transparent 52%)," +
                "linear-gradient(145deg, #3a1820 0%, #201217 55%, #141310 100%)",
            }}
            aria-hidden
          />
          <div className="relative">
            <BrandLogo className="text-white" />
          </div>
          <div className="relative">
            {sideEyebrow && (
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/70">
                {sideEyebrow}
              </span>
            )}
            <h2 className="mt-3 max-w-[16ch] font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.02em] text-white">
              {sideTitle}
            </h2>
            {sidePoints && (
              <ul className="mt-6 space-y-2.5">
                {sidePoints.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-[14px] text-white/85">
                    <span className="size-1.5 rounded-full bg-white/70" />
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* form panel */}
        <div className="flex flex-col justify-center p-6 sm:p-9">
          <div className="lg:hidden">
            <BrandLogo />
          </div>
          <h1 className="mt-5 font-display text-[26px] font-semibold tracking-[-0.02em] lg:mt-0">
            {title}
          </h1>
          {subtitle && <p className="mt-1.5 text-[14px] text-muted-foreground">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-center text-[13.5px] text-muted-foreground">{footer}</div>}
        </div>
        </motion.div>
      </div>
    </div>
  );
}
