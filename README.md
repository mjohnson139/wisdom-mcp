# wisdom-mcp

An MCP server for books of wisdom. The engine is generic: every book is a **content pack** of entries (chapters, cards, verses), spreads and personas. The engine serves any pack through the same tools, so an AI assistant can look up a passage, draw one at random, search for the right teaching for a situation, or give a reading in the book's voice.

It runs on **Cloudflare Workers** using Cloudflare's stateless `createMcpHandler`. It also runs locally over stdio for Claude Desktop.

## Books

| Pack | Entries | Source text | Commentary |
|---|---|---|---|
| `tao-of-leadership` | 81 chapters | Tao Te Ching, tr. James Legge (1891), public domain | Original leadership reflections (10 of 81 written so far) |

The Tao of Leadership pack reads the Tao Te Ching as a guide for people who lead groups. Its chapter numbering matches John Heider's *The Tao of Leadership* (1985), which is recommended as further reading. Heider's text is copyrighted and is **not** included.

## Tools

| Tool | What it does |
|---|---|
| `list_books` | Lists the books with their spreads, personas and sources |
| `get_entry` | Returns one entry in full: the text plus any reflection, question and practice |
| `draw` | Draws 1–10 distinct entries at random |
| `search` | Finds passages for a situation or idea, ranked by title, theme, text and commentary |
| `themes` | Lists a book's themes, or the entries that carry one theme |
| `reading` | Draws entries into a spread's positions and adds interpretation guidance for the book's persona |
| `get_persona` | Returns a persona's voice guidelines |

There is also one prompt, `daily_reflection`.

The `book` argument is optional when only one book is installed.

### Tao of Leadership spreads

- `daily`: one teaching for the day.
- `three_stances`: the situation, the stance and the action.
- `leaders_mirror`: how you lead, what you grip too tightly, what your people need, and the quiet move.

The persona is **The Sage**, an unhurried facilitator who has learned to do less.

## Use it

### Remote (once deployed)

```bash
claude mcp add wisdom --transport http https://wisdom-mcp.<your-subdomain>.workers.dev/mcp
```

For Claude Desktop or claude.ai, add the same URL as a custom connector.

### Local (stdio)

```bash
npm install
npm run build:local
```

```json
{
  "mcpServers": {
    "wisdom": { "command": "node", "args": ["/path/to/wisdom-mcp/dist/local.js"] }
  }
}
```

## Develop

```bash
npm install
npm test          # unit tests (content + library + worker routes)
npm run dev       # wrangler dev on http://localhost:8787/mcp
npm run smoke     # end-to-end MCP checks against the dev server (run in a second terminal)
npm run deploy    # bundle content and deploy to Cloudflare
npm run smoke -- https://wisdom-mcp.<your-subdomain>.workers.dev   # check the deployment
```

The first deploy asks you to log in with `npx wrangler login`. The Workers free tier covers 100k requests a day.

### How it fits together

```
content/<book>/pack.json        metadata, sources, spreads, personas
content/<book>/entries/NN.md    one file per entry: frontmatter + ## Text / Reflection / Question / Practice
scripts/bundle.mjs              packs content/ into src/generated/packs.ts (Workers have no filesystem)
src/library.ts                  pure queries: lookup, draw, search, themes, readings
src/format.ts                   markdown output for tools
src/server.ts                   createServer(): registers the MCP tools and prompt
src/index.ts                    Cloudflare Worker: /mcp, /health and a landing page at /
src/local.ts                    stdio entry for desktop clients
```

To add a book or write commentary, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

The code and original commentary are MIT licensed. Source texts carry their own licenses, which are listed in each pack's `pack.json`.
