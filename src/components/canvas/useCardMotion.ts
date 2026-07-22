"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const rand = gsap.utils.random;

/**
 * Canvas card motion: a staggered entrance (fade + rise + settle) that hands
 * off to a whisper-subtle vertical "breathing" bob — enough to feel alive,
 * small enough that the text reads as still.
 *
 * Only `y` drifts, by a couple of pixels. The connecting edges anchor to each
 * node's *resting* position (React Flow computes them from the stored layout,
 * not from this transform), so any float visually pulls the card away from its
 * lines — a big amplitude, horizontal sway, or rotation makes the links look
 * off-centre and tilts the text. Keeping the motion tiny and vertical-only
 * keeps both the text and the edge anchoring visually intact.
 *
 * Applied to the inner card (not the React Flow wrapper) so it never fights
 * React Flow's own position transform. `scale` is left free so the `bumpNode`
 * interaction can run on top. Honors reduced-motion.
 */
export function useCardMotion(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;

    const enterDelay = rand(0, 0.35);
    const enterDur = 0.62;

    const ctx = gsap.context(() => {
      // Staggered entrance with a soft overshoot so cards "settle" into place.
      gsap.from(el, {
        opacity: 0,
        y: 20,
        scale: 0.94,
        duration: enterDur,
        delay: enterDelay,
        ease: "back.out(1.5)",
      });

      // Perpetual bob: tiny, slow, vertical-only. Starts after the entrance
      // lands at y:0 so it never fights the entrance's own y tween. A random
      // duration desyncs cards from each other over time.
      gsap.to(el, {
        y: `+=${rand(2.5, 4)}`,
        duration: rand(3.8, 5.2),
        delay: enterDelay + enterDur,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    });
    return () => ctx.revert();
  }, [ref]);
}

/** Quick scale "settle" bump on a node's card, by React Flow node id. */
export function bumpNode(id: string, opts?: { ring?: boolean; scale?: number }) {
  if (reduced()) return;
  const card = document.querySelector<HTMLElement>(
    `.react-flow__node[data-id="${CSS.escape(id)}"] .canvas-card`,
  );
  if (!card) return;
  // scale is independent of the float's y tween, so they coexist.
  gsap.fromTo(
    card,
    { scale: 1 },
    {
      scale: opts?.scale ?? 1.07,
      duration: 0.16,
      yoyo: true,
      repeat: 1,
      ease: "power2.out",
    },
  );
  if (opts?.ring) {
    card.classList.remove("hub-pulse");
    // reflow so the animation can restart if fired again quickly
    void card.offsetWidth;
    card.classList.add("hub-pulse");
    window.setTimeout(() => card.classList.remove("hub-pulse"), 650);
  }
}
