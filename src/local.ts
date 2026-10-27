// Local stdio entry for Claude Desktop and other desktop MCP clients.
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { packs } from "./generated/packs.js";
import { Library } from "./library.js";
import { createServer } from "./server.js";

const library = new Library(packs);
serveStdio(() => createServer(library));
