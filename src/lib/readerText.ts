// Reader text pipeline for the co-reading workspace.
//
// The backend serves raw PyPDF2 `extracted_text`: hard-wrapped lines, hyphen
// splits, inconsistent spacing. We clean it ONCE, deterministically, on the
// client — the cleaned string is the anchor base for every highlight/note
// (character offsets index into it). Because cleanup is pure, offsets are
// reproducible across reloads. When we later add a backend "readerize" pass,
// notes re-anchor against the new base via their stored quoted_text.

/** Target character length for a synthesized display paragraph. */
const PARAGRAPH_TARGET = 360;
/** Blocks longer than this with no internal breaks get sentence-grouped. */
const LONG_BLOCK = 700;

/**
 * De-hyphenate, repair PDF extraction artifacts (run-together words, letter-
 * spaced headers), merge wrapped lines, and normalise whitespace. Runs ONCE and
 * deterministically — its output is the anchor base for every highlight/note.
 */
export function cleanExtractedText(raw: string): string {
  if (!raw) return "";
  let text = raw.replace(/\r\n?/g, "\n");

  // Join words split across a line break by a hyphen: "hyper-\nconjugation".
  text = text.replace(/([A-Za-z])-\n(?=[a-z])/g, "$1");

  // Collapse runs of blank lines to exactly two (paragraph separator).
  text = text.replace(/\n[ \t]*\n[ \t]*(\n[ \t]*)*/g, "\n\n");

  // Within a paragraph, turn single newlines (hard wraps) into spaces.
  text = text.replace(/([^\n])\n(?!\n)/g, "$1 ");

  // Collapse letter-spaced headers: "F U L L S T A C K" -> "FULLSTACK".
  // Remove a space sitting between two single-letter capitals.
  text = text.replace(/(?<=\b[A-Z]) (?=[A-Z]\b)/g, "");

  // Re-space words glued at sentence punctuation: "businesses.During".
  text = text.replace(/([.!?,;:])([A-Z])/g, "$1 $2");

  // Re-space section joins with no punctuation: "IntelligenceAbout" -> two words.
  // Conservative: a real lowercase word run followed by a Capital + lowercase run.
  text = text.replace(/([a-z]{4,})([A-Z][a-z]{3,})/g, "$1 $2");

  // Tidy spacing.
  text = text.replace(/[ \t]{2,}/g, " ");
  text = text
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n\n");

  return text;
}

export interface Paragraph {
  text: string;
  /** Character offset of this paragraph's first char within the full text. */
  start: number;
}

/**
 * Split cleaned text into display paragraphs, tracking each one's absolute start
 * offset so DOM ranges map back to global character offsets. Real blank-line
 * blocks are honored; a giant unbroken block (common for PDFs with no paragraph
 * structure) is grouped into readable chunks at sentence boundaries. Offsets are
 * always true positions in `cleaned`, so anchoring stays exact.
 */
export function toParagraphs(cleaned: string): Paragraph[] {
  const out: Paragraph[] = [];
  let cursor = 0;
  for (const block of cleaned.split("\n\n")) {
    if (block.length > LONG_BLOCK) {
      out.push(...splitLongBlock(block, cursor));
    } else {
      out.push({ text: block, start: cursor });
    }
    cursor += block.length + 2; // + the "\n\n" separator
  }
  return out;
}

/**
 * Group a long unbroken block into ~PARAGRAPH_TARGET-sized chunks, breaking only
 * at sentence ends. Each chunk keeps its true offset within `cleaned` (base +
 * local start); only trailing whitespace is trimmed, so slice(start, start+len)
 * still equals the chunk text.
 */
function splitLongBlock(block: string, base: number): Paragraph[] {
  const out: Paragraph[] = [];
  const re = /[.!?]["')\]]*\s+/g; // end of sentence + following whitespace
  let chunkStart = 0;
  while (re.exec(block) !== null) {
    const boundary = re.lastIndex; // position after the whitespace
    if (boundary - chunkStart >= PARAGRAPH_TARGET) {
      out.push({
        text: block.slice(chunkStart, boundary).trimEnd(),
        start: base + chunkStart,
      });
      chunkStart = boundary;
    }
  }
  if (chunkStart < block.length) {
    out.push({ text: block.slice(chunkStart).trimEnd(), start: base + chunkStart });
  }
  return out;
}

export interface Segment {
  text: string;
  /** Note id if this segment is covered by a highlight, else null. */
  noteId: string | null;
}

export interface Anchor {
  id: string;
  start: number;
  end: number;
}

/**
 * Split one paragraph into plain / highlighted segments given the anchors that
 * intersect it. Overlapping anchors resolve to the first one covering a char.
 */
export function segmentParagraph(
  para: Paragraph,
  anchors: Anchor[],
): Segment[] {
  const pStart = para.start;
  const pEnd = para.start + para.text.length;

  const hits = anchors
    .filter((a) => a.start < pEnd && a.end > pStart && a.end > a.start)
    .sort((a, b) => a.start - b.start);

  if (hits.length === 0) return [{ text: para.text, noteId: null }];

  // Build a per-char owner map (local to the paragraph).
  const owner: (string | null)[] = new Array(para.text.length).fill(null);
  for (const a of hits) {
    const from = Math.max(0, a.start - pStart);
    const to = Math.min(para.text.length, a.end - pStart);
    for (let i = from; i < to; i++) {
      if (owner[i] === null) owner[i] = a.id;
    }
  }

  const segs: Segment[] = [];
  let i = 0;
  while (i < para.text.length) {
    const cur = owner[i];
    let j = i + 1;
    while (j < para.text.length && owner[j] === cur) j++;
    segs.push({ text: para.text.slice(i, j), noteId: cur });
    i = j;
  }
  return segs;
}

/**
 * Fuzzy re-anchor: if stored offsets no longer match quoted_text (the reader
 * text drifted), relocate the quote by exact substring search. Returns updated
 * [start, end] or null if the quote can't be found.
 */
export function reanchor(
  fullText: string,
  quote: string,
  hintStart: number,
): [number, number] | null {
  if (!quote) return null;
  // Fast path: offsets still valid.
  if (fullText.slice(hintStart, hintStart + quote.length) === quote) {
    return [hintStart, hintStart + quote.length];
  }
  const idx = fullText.indexOf(quote);
  if (idx === -1) return null;
  return [idx, idx + quote.length];
}
