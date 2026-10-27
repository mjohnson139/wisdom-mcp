import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { formatBooks, formatEntry, formatPersonaGuidance, formatReading, formatSearch } from "./format.js";
import { Library, LibraryError } from "./library.js";

const VERSION = "0.1.0";

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

/** Runs a tool body, turning LibraryErrors into MCP tool errors the model can read and recover from. */
function respond(fn: () => string): ToolResult {
  try {
    return { content: [{ type: "text", text: fn() }] };
  } catch (err) {
    if (err instanceof LibraryError) return { content: [{ type: "text", text: err.message }], isError: true };
    throw err;
  }
}

const book = z.string().optional().describe("Book id from list_books. Optional when only one book is installed.");

export function createServer(library: Library): McpServer {
  const server = new McpServer({ name: "wisdom-mcp", version: VERSION });

  server.registerTool(
    "list_books",
    {
      description: "List the books of wisdom available, with their spreads, personas and sources.",
      inputSchema: {},
    },
    async () => respond(() => formatBooks(library.packs))
  );

  server.registerTool(
    "get_entry",
    {
      description: "Read one entry (e.g. a chapter) in full: source text plus any reflection, question and practice.",
      inputSchema: { book, number: z.number().int().describe("Entry number, e.g. chapter 17.") },
    },
    async ({ book, number }) =>
      respond(() => {
        const pack = library.book(book);
        return formatEntry(pack, library.entry(pack, number));
      })
  );

  server.registerTool(
    "draw",
    {
      description: "Draw one or more entries at random, like drawing a card, for reflection or a daily teaching.",
      inputSchema: { book, count: z.number().int().min(1).max(10).default(1).describe("How many distinct entries to draw.") },
    },
    async ({ book, count }) =>
      respond(() => {
        const pack = library.book(book);
        return library
          .draw(pack, count)
          .map((e) => formatEntry(pack, e))
          .join("\n\n---\n\n");
      })
  );

  server.registerTool(
    "search",
    {
      description:
        "Find passages relevant to a situation or idea (e.g. 'conflict on my team', 'letting go of control'). Searches titles, themes, text and commentary.",
      inputSchema: {
        query: z.string().min(1),
        book: z.string().optional().describe("Limit to one book id. Omit to search every book."),
        limit: z.number().int().min(1).max(20).default(5),
      },
    },
    async ({ query, book, limit }) => respond(() => formatSearch(query, library.search(query, book, limit)))
  );

  server.registerTool(
    "themes",
    {
      description: "Without a theme: list a book's themes with entry counts. With a theme: list the entries that carry it.",
      inputSchema: { book, theme: z.string().optional().describe("e.g. humility, non-action, service.") },
    },
    async ({ book, theme }) =>
      respond(() => {
        const pack = library.book(book);
        if (!theme) {
          return [`Themes in ${pack.title}:`, "", ...library.themes(pack).map((t) => `- ${t.theme} (${t.count})`)].join("\n");
        }
        const entries = library.byTheme(pack, theme);
        if (entries.length === 0) return `No ${pack.unit}s carry the theme "${theme}". Call themes without a theme to see the list.`;
        return [`${cap(pack.unit)}s on "${theme}":`, "", ...entries.map((e) => `- ${e.number}: ${e.title}`)].join("\n");
      })
  );

  server.registerTool(
    "reading",
    {
      description:
        "Do a reading: draw entries into the positions of a spread (see list_books for each book's spreads), with guidance for interpreting them in the book's persona.",
      inputSchema: {
        book,
        spread: z.string().default("daily").describe("Spread id, e.g. daily, three_stances, leaders_mirror."),
        question: z.string().optional().describe("The situation or question the reading is for."),
        persona: z.string().optional().describe("Persona id to interpret in. Defaults to the book's default persona."),
      },
    },
    async ({ book, spread, question, persona }) =>
      respond(() => {
        const pack = library.book(book);
        const voice = Object.keys(pack.personas).length ? library.persona(pack, persona) : undefined;
        return formatReading(library.reading(pack, spread), voice, question);
      })
  );

  server.registerTool(
    "get_persona",
    {
      description: "Get a persona's voice guidelines, to stay in character through a longer conversation.",
      inputSchema: { book, persona: z.string().optional() },
    },
    async ({ book, persona }) =>
      respond(() => {
        const pack = library.book(book);
        return formatPersonaGuidance(library.persona(pack, persona));
      })
  );

  server.registerPrompt(
    "daily_reflection",
    {
      description: "Begin the day with one teaching from a book of wisdom.",
      argsSchema: { book: z.string().optional().describe("Book id. Optional when only one book is installed.") },
    },
    ({ book }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Use the wisdom-mcp reading tool with the "daily" spread${book ? ` for the book "${book}"` : ""}. Share the teaching in the book's persona, keep it brief, and end with its question for me to sit with today.`,
          },
        },
      ],
    })
  );

  return server;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
