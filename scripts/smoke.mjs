// End-to-end check against a running server: `npm run smoke` (wrangler dev) or
// `npm run smoke -- https://wisdom-mcp.<you>.workers.dev` after deploying.
const base = (process.argv[2] ?? "http://localhost:8787").replace(/\/$/, "");
let id = 0;

async function rpc(method, params = {}) {
  const res = await fetch(`${base}/mcp`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "mcp-protocol-version": "2025-06-18",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
  });
  const body = await res.text();
  const json = body.trimStart().startsWith("{") ? body : body.split("\n").find((l) => l.startsWith("data:"))?.slice(5);
  if (!json) throw new Error(`${method}: HTTP ${res.status} ${body.slice(0, 200)}`);
  const msg = JSON.parse(json);
  if (msg.error) throw new Error(`${method}: ${JSON.stringify(msg.error)}`);
  return msg.result;
}

const call = (name, args = {}) => rpc("tools/call", { name, arguments: args });
const text = (r) => r.content[0].text;
const checks = [
  ["tools/list has 7 tools", async () => (await rpc("tools/list")).tools.length === 7],
  ["get_entry 17", async () => text(await call("get_entry", { number: 17 })).includes("The Invisible Leader")],
  ["get_entry 99 is a tool error", async () => (await call("get_entry", { number: 99 })).isError === true],
  ["draw 3", async () => text(await call("draw", { count: 3 })).split("\n---\n").length === 3],
  ["search water → ch. 8 first", async () => text(await call("search", { query: "water" })).includes("tao-of-leadership 8:")],
  ["themes", async () => text(await call("themes", {})).includes("humility")],
  ["reading leaders_mirror", async () => text(await call("reading", { spread: "leaders_mirror", question: "My team is stuck" })).includes("The Sage")],
  ["prompts/list", async () => (await rpc("prompts/list")).prompts[0].name === "daily_reflection"],
];

let failed = 0;
for (const [name, check] of checks) {
  try {
    const ok = await check();
    console.log(`${ok ? "✓" : "✗"} ${name}`);
    if (!ok) failed++;
  } catch (err) {
    console.log(`✗ ${name}: ${err.message}`);
    failed++;
  }
}
process.exit(failed ? 1 : 0);
