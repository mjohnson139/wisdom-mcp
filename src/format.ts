import type { Reading, SearchHit } from "./library.js";
import type { Entry, Pack, Persona } from "./types.js";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function formatEntry(pack: Pack, entry: Entry, heading = "##"): string {
  const out = [
    `${heading} ${cap(pack.unit)} ${entry.number}: ${entry.title}`,
    `*${pack.title}* · themes: ${entry.themes.join(", ")}`,
    "",
    entry.text
      .split("\n")
      .map((l) => `> ${l}`)
      .join("\n"),
  ];
  if (entry.reflection) out.push("", "**Reflection**", "", entry.reflection);
  if (entry.question) out.push("", "**Question**", "", entry.question);
  if (entry.practice) out.push("", "**Practice**", "", entry.practice);
  if (!entry.reflection) {
    out.push("", `_No commentary written yet for this ${pack.unit}. Interpret the text directly._`);
  }
  return out.join("\n");
}

export function formatBooks(packs: Pack[]): string {
  return packs
    .map((p) =>
      [
        `## ${p.title} (\`${p.id}\`)`,
        ...(p.subtitle ? [`*${p.subtitle}*`] : []),
        "",
        p.description,
        "",
        `- ${p.entries.length} ${p.unit}s, by ${p.author}`,
        `- Spreads: ${Object.keys(p.spreads).join(", ") || "none"}`,
        `- Personas: ${Object.keys(p.personas).join(", ") || "none"}`,
        `- Sources: ${p.sources.map((s) => `${s.title}${s.translator ? `, tr. ${s.translator}` : ""} (${s.license}; ${s.covers})`).join("; ")}`,
        ...(p.further_reading?.length ? [`- Further reading: ${p.further_reading.join(" ")}`] : []),
      ].join("\n")
    )
    .join("\n\n");
}

export function formatSearch(query: string, hits: SearchHit[]): string {
  if (hits.length === 0) return `No passages found for "${query}". Try a theme name or a simpler word.`;
  return [
    `Passages for "${query}":`,
    "",
    ...hits.map(
      (h) => `- **${h.pack.id} ${h.entry.number}: ${h.entry.title}** (${h.entry.themes.join(", ")}): ${preview(h.entry.text)}`
    ),
    "",
    "Use get_entry to read any of these in full.",
  ].join("\n");
}

export function formatReading(r: Reading, persona: Persona | undefined, question?: string): string {
  const out = [`# ${r.spread.name}: ${r.pack.title}`, "", r.spread.description];
  if (question) out.push("", `**Question:** ${question}`);
  for (const [i, d] of r.draws.entries()) {
    out.push("", "---", "", `### ${i + 1}. ${d.position.name}`, `*${d.position.meaning}*`, "", formatEntry(r.pack, d.entry, "####"));
  }
  if (persona) out.push("", "---", "", formatPersonaGuidance(persona));
  return out.join("\n");
}

export function formatPersonaGuidance(p: Persona): string {
  return [
    `**Interpret as ${p.name}:** ${p.description}`,
    ...p.voice.map((v) => `- ${v}`),
    ...(p.opening ? [`- Opening line: "${p.opening}"`] : []),
    ...(p.closing ? [`- Closing line: "${p.closing}"`] : []),
  ].join("\n");
}

function preview(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
}
