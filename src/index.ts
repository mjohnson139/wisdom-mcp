import { createMcpHandler } from "agents/mcp/server";
import { packs } from "./generated/packs.js";
import { formatBooks } from "./format.js";
import { Library } from "./library.js";
import { createServer } from "./server.js";

const library = new Library(packs);
const mcp = createMcpHandler(() => createServer(library));

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === "/") {
      return new Response(`# wisdom-mcp\n\nConnect an MCP client to /mcp.\n\n${formatBooks(packs)}\n`, {
        headers: { "content-type": "text/markdown; charset=utf-8" },
      });
    }
    if (pathname === "/health") return Response.json({ status: "ok", books: packs.map((p) => p.id) });
    return mcp(request, env, ctx);
  },
} satisfies ExportedHandler;
