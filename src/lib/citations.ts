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
