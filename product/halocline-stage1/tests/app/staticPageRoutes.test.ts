import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { checkpointHtml, handleCheckpointFetch, mapShellHtml } from "../../app/checkpointServer.ts";
import { resolveStaticPageRewrite, staticPageRewrites } from "../../app/staticPageRoutes.ts";

test("static page routes without a trailing slash rewrite to their generated index.html", () => {
  assert.equal(resolveStaticPageRewrite("/map"), "/map/index.html");
  assert.equal(resolveStaticPageRewrite("/checkpoint"), "/checkpoint/index.html");
  assert.equal(resolveStaticPageRewrite("/map?recharge=1.2"), "/map/index.html?recharge=1.2");
  assert.equal(resolveStaticPageRewrite("/checkpoint#results"), "/checkpoint/index.html#results");
});

test("other paths are left for Vite to resolve", () => {
  for (const url of [undefined, "", "/", "/map/", "/checkpoint/", "/mapping", "/api/map-scenario", "/assets/x.png"]) {
    assert.equal(resolveStaticPageRewrite(url), undefined, String(url));
  }
});

test("vercel.json rewrites match the static page routes", async () => {
  const vercelConfig = JSON.parse(await readFile(new URL("../../vercel.json", import.meta.url), "utf8"));

  assert.deepEqual(
    vercelConfig.rewrites,
    Object.entries(staticPageRewrites).map(([source, destination]) => ({ source, destination })),
  );
});

test("legacy server serves static pages with and without a trailing slash", async () => {
  for (const [path, html] of [
    ["/map", mapShellHtml],
    ["/map/", mapShellHtml],
    ["/checkpoint", checkpointHtml],
    ["/checkpoint/", checkpointHtml],
  ] as const) {
    const response = await handleCheckpointFetch(new Request(`http://127.0.0.1${path}`));

    assert.equal(response.status, 200, path);
    assert.equal(await response.text(), html, path);
  }
});

test("checkpoint grid scrolls inside its panel instead of overflowing into Results", () => {
  const gridWrapRule = checkpointHtml.match(/\.grid-wrap \{([^}]*)\}/)?.[1] ?? "";
  const aquiferGridRule = checkpointHtml.match(/\.aquifer-grid \{([^}]*)\}/)?.[1] ?? "";

  assert.match(gridWrapRule, /overflow: auto;/);
  assert.match(gridWrapRule, /min-width: 0;/);
  assert.doesNotMatch(gridWrapRule, /place-items: center;/);
  assert.match(aquiferGridRule, /min-width: min-content;/);
});
