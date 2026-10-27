export interface Entry {
  number: number;
  title: string;
  themes: string[];
  /** The source text (public domain or otherwise licensed for redistribution). */
  text: string;
  /** Original commentary. Optional: a pack can grow its commentary over time. */
  reflection?: string;
  question?: string;
  practice?: string;
}

export interface SpreadPosition {
  name: string;
  meaning: string;
}

export interface Spread {
  name: string;
  description: string;
  positions: SpreadPosition[];
}

export interface Persona {
  name: string;
  description: string;
  voice: string[];
  opening?: string;
  closing?: string;
}

export interface Source {
  title: string;
  author?: string;
  translator?: string;
  license: string;
  url?: string;
  covers: string;
}

export interface Pack {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  /** What one entry is called in this book: "chapter", "card", "verse"... */
  unit: string;
  description: string;
  sources: Source[];
  further_reading?: string[];
  spreads: Record<string, Spread>;
  personas: Record<string, Persona>;
  default_persona?: string;
  entries: Entry[];
}
