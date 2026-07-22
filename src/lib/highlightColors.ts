// The four co-reading highlight tones. Vermillion is the signature default;
// the rest are warm-tuned to sit inside the Onyx/Paper palette. Freeform — the
// labels are soft hints, not enforced categories. Mark styling lives in
// global.css as `.hl-<name>`; the swatch dot uses the raw CSS var.

export const HIGHLIGHT_COLORS = ["vermillion", "honey", "sage", "sky"] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

export const DEFAULT_HIGHLIGHT: HighlightColor = "vermillion";

export const COLOR_LABEL: Record<HighlightColor, string> = {
  vermillion: "Vermillion",
  honey: "Honey",
  sage: "Sage",
  sky: "Sky",
};

/** CSS var for the solid swatch dot / accents. */
export const colorVar = (c: HighlightColor) => `var(--hl-${c})`;

/** Normalise an arbitrary stored color string to a known tone. */
export function asHighlightColor(value: string | null | undefined): HighlightColor {
  return (HIGHLIGHT_COLORS as readonly string[]).includes(value ?? "")
    ? (value as HighlightColor)
    : DEFAULT_HIGHLIGHT;
}
