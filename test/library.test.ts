import { describe, expect, it } from "vitest";
import { packs } from "../src/generated/packs.js";
import { Library, LibraryError } from "../src/library.js";

const library = new Library(packs);
const tao = library.book("tao-of-leadership");

describe("content", () => {
  it("bundles all 81 chapters in order with source text", () => {
    expect(tao.entries.map((e) => e.number)).toEqual(Array.from({ length: 81 }, (_, i) => i + 1));
    for (const e of tao.entries) {
      expect(e.text.length).toBeGreaterThan(50);
      expect(e.themes.length).toBeGreaterThan(0);
    }
  });

  it("keeps verse line breaks from the Legge text", () => {
    expect(library.entry(tao, 6).text.split("\n")).toHaveLength(6);
  });

  it("has a complete question and practice wherever a reflection exists", () => {
    for (const e of tao.entries.filter((e) => e.reflection)) {
      expect(e.question, `chapter ${e.number}`).toBeTruthy();
      expect(e.practice, `chapter ${e.number}`).toBeTruthy();
    }
  });

  it("only uses spreads whose positions fit in the book", () => {
    for (const s of Object.values(tao.spreads)) expect(s.positions.length).toBeLessThanOrEqual(tao.entries.length);
  });
});

describe("Library", () => {
  it("defaults to the only book and rejects unknown ids", () => {
    expect(library.book()).toBe(tao);
    expect(() => library.book("nope")).toThrow(LibraryError);
  });

  it("rejects out-of-range entries", () => {
    expect(() => library.entry(tao, 82)).toThrow(/range 1–81/);
  });

  it("draws distinct entries", () => {
    const drawn = library.draw(tao, 10);
    expect(new Set(drawn.map((e) => e.number)).size).toBe(10);
    expect(() => library.draw(tao, 0)).toThrow(LibraryError);
  });

  it("draws deterministically with an injected random source", () => {
    const fixed = new Library(packs, () => 0);
    expect(fixed.draw(fixed.book(), 1)[0].number).toBe(fixed.draw(fixed.book(), 1)[0].number);
  });

  it("ranks title and theme matches first", () => {
    const hits = library.search("water");
    expect(hits[0].entry.number).toBe(8);
    expect(library.search("leadership").every((h) => h.score > 0)).toBe(true);
  });

  it("finds entries by theme, ignoring hyphens and case", () => {
    expect(library.byTheme(tao, "Non Action").length).toBeGreaterThan(5);
  });

  it("fills every position of a spread", () => {
    const r = library.reading(tao, "leaders_mirror");
    expect(r.draws).toHaveLength(4);
    expect(() => library.reading(tao, "nope")).toThrow(/Available/);
  });

  it("resolves the default persona", () => {
    expect(library.persona(tao).name).toBe("The Sage");
  });
});
