# wisdom-mcp

[![CI](https://github.com/mjohnson139/wisdom-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/mjohnson139/wisdom-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-server-8A2BE2)](https://modelcontextprotocol.io)
[![Cloudflare Workers](https://img.shields.io/badge/runs%20on-Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/agents/model-context-protocol/)

**Books of wisdom, served to your AI assistant.**

An MCP server for books of wisdom. The engine is generic: every book is a **content pack** of entries (chapters, cards, verses), spreads and personas. The engine serves any pack through the same tools, so an assistant like Claude can look up a passage, draw one at random, search for the right teaching for a situation, or give a reading in the book's voice.

It runs on **Cloudflare Workers** using Cloudflare's stateless `createMcpHandler`. It also runs locally over stdio for Claude Desktop.

> *"The highest excellence is like (that of) water. The excellence of water appears in its benefiting all things, and in its occupying, without striving (to the contrary), the low place which all men dislike."*
> Tao Te Ching, chapter 8 (tr. James Legge)

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

## Example

Ask Claude *"Do a Three Stances reading for me: two senior engineers on my team keep clashing."* and the `reading` tool returns something like this (shortened):

```markdown
# Three Stances: Tao of Leadership

**Question:** Two senior engineers keep clashing

### 1. The situation
*What is really happening, beneath the surface.*
#### Chapter 56: Those Who Know Don't Talk
> He who knows (the Tao) does not (care to) speak (about it)...

### 2. The stance
*The inner posture to take toward it.*
#### Chapter 26: Gravity and Stillness
> Gravity is the root of lightness; stillness, the ruler of movement...

### 3. The action
*The small, timely move that serves the whole.*
#### Chapter 57: Govern by Letting Be
> ...I will do nothing (of purpose), and the people will be transformed of themselves...

**Reflection**
The more prohibitions there are, the poorer the people become...

**Question**
Which rule or process exists because we didn't trust people, and what has it cost us?

**Interpret as The Sage:** An unhurried facilitator who has led groups for a long time and learned to do less.
```

Claude then gives the reading in The Sage's voice.

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

## Contributing

Contributions of commentary and new books are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md), or open an issue to [propose commentary](https://github.com/mjohnson139/wisdom-mcp/issues/new?template=commentary.yml) for a chapter.

## Roadmap

- [x] Generic engine: entries, spreads, personas and search
- [x] Tao of Leadership pack with all 81 chapters (Legge translation)
- [ ] Original commentary for every chapter (10 of 81 written)
- [ ] Public deployment on Cloudflare Workers
- [ ] More books (ideas: *Meditations*, *The Art of War*, *Dhammapada*). [Propose one](https://github.com/mjohnson139/wisdom-mcp/issues/new?template=new-book.yml)
- [ ] Port the [Lakota Sweat Lodge Cards](https://github.com/mjohnson139/lakota-sweat-lodge-mcp) deck to a pack

## License

The code and original commentary are MIT licensed. Source texts carry their own licenses, which are listed in each pack's `pack.json`.
