import { describe, expect, it } from "vitest";
import worker from "../src/index.js";

const ctx = { waitUntil() {}, passThroughOnException() {}, props: {} } as unknown as ExecutionContext;
// MCP traffic is covered by scripts/smoke.mjs against wrangler dev: Node's Request
// drops the Host header, which the Cloudflare handler validates.
describe("worker", () => {
  it("serves health and a landing page", async () => {
    const health = await worker.fetch(new Request("http://localhost/health") as never, {}, ctx);
    expect(await health.json()).toEqual({ status: "ok", books: ["tao-of-leadership"] });
    const home = await worker.fetch(new Request("http://localhost/") as never, {}, ctx);
    expect(await home.text()).toContain("Tao of Leadership");
  });
});
