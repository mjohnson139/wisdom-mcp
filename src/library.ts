import type { Entry, Pack, Persona, Spread } from "./types.js";

export type Random = () => number;

export interface SearchHit {
  pack: Pack;
  entry: Entry;
  score: number;
}

export interface Reading {
  pack: Pack;
  spread: Spread;
  draws: { position: Spread["positions"][number]; entry: Entry }[];
}

export class LibraryError extends Error {}

/** Read-only queries over the bundled packs. Pure, so it runs the same on Workers and Node. */
export class Library {
  private readonly byId: Map<string, Pack>;

  constructor(
    readonly packs: Pack[],
    private readonly random: Random = Math.random
  ) {
    this.byId = new Map(packs.map((p) => [p.id, p]));
  }

  /** Resolves a book id, defaulting to the only book when there is just one. */
  book(id?: string): Pack {
    if (!id) {
      if (this.packs.length === 1) return this.packs[0];
      throw new LibraryError(`Specify a book. Available: ${this.ids()}`);
    }
    const pack = this.byId.get(id);
    if (!pack) throw new LibraryError(`Unknown book "${id}". Available: ${this.ids()}`);
    return pack;
  }

  entry(pack: Pack, number: number): Entry {
    const entry = pack.entries.find((e) => e.number === number);
    if (!entry) {
      const first = pack.entries[0]?.number;
      const last = pack.entries.at(-1)?.number;
      throw new LibraryError(`${pack.title} has no ${pack.unit} ${number} (range ${first}–${last}).`);
    }
    return entry;
  }

  /** Draws `count` distinct entries at random. */
  draw(pack: Pack, count: number): Entry[] {
    if (count < 1 || count > pack.entries.length) {
      throw new LibraryError(`Can draw between 1 and ${pack.entries.length} ${pack.unit}s.`);
    }
    const pool = [...pack.entries];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }

  themes(pack: Pack): { theme: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const e of pack.entries) for (const t of e.themes) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts].map(([theme, count]) => ({ theme, count })).sort((a, b) => b.count - a.count || a.theme.localeCompare(b.theme));
  }

  byTheme(pack: Pack, theme: string): Entry[] {
    const t = normalize(theme);
    return pack.entries.filter((e) => e.themes.some((x) => normalize(x) === t));
  }

  /** Keyword search across titles, themes, source text and commentary. */
  search(query: string, bookId?: string, limit = 5): SearchHit[] {
    const terms = normalize(query).split(/\s+/).filter((t) => t.length > 1);
    if (terms.length === 0) throw new LibraryError("Search query is empty.");
    const packs = bookId ? [this.book(bookId)] : this.packs;
    const hits: SearchHit[] = [];
    for (const pack of packs) {
      for (const entry of pack.entries) {
        const title = normalize(entry.title);
        const themes = entry.themes.map(normalize).join(" ");
        const body = normalize([entry.text, entry.reflection, entry.question, entry.practice].join(" "));
        let score = 0;
        for (const term of terms) {
          if (title.includes(term)) score += 5;
          if (themes.includes(term)) score += 3;
          score += Math.min(count(body, term), 3);
        }
        if (score > 0) hits.push({ pack, entry, score });
      }
    }
    return hits.sort((a, b) => b.score - a.score || a.entry.number - b.entry.number).slice(0, limit);
  }

  reading(pack: Pack, spreadId: string): Reading {
    const spread = pack.spreads[spreadId];
    if (!spread) {
      throw new LibraryError(`Unknown spread "${spreadId}". Available: ${Object.keys(pack.spreads).join(", ")}`);
    }
    const entries = this.draw(pack, spread.positions.length);
    return { pack, spread, draws: spread.positions.map((position, i) => ({ position, entry: entries[i] })) };
  }

  persona(pack: Pack, id?: string): Persona {
    const key = id ?? pack.default_persona ?? Object.keys(pack.personas)[0];
    const persona = key ? pack.personas[key] : undefined;
    if (!persona) {
      throw new LibraryError(`Unknown persona "${id}". Available: ${Object.keys(pack.personas).join(", ") || "none"}`);
    }
    return persona;
  }

  private ids(): string {
    return this.packs.map((p) => p.id).join(", ");
  }
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[-_]/g, " ");
}

function count(haystack: string, needle: string): number {
  let n = 0;
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + needle.length)) n++;
  return n;
}
