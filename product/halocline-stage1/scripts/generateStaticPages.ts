import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { checkpointHtml, mapShellHtml } from "../app/checkpointServer.ts";
import { marketingHtml } from "../app/marketingPage.ts";

async function writeStaticPage(path: string, html: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, html);
}

await Promise.all([
  writeStaticPage(new URL("../web/index.html", import.meta.url).pathname, marketingHtml),
  writeStaticPage(new URL("../web/map/index.html", import.meta.url).pathname, mapShellHtml),
  writeStaticPage(new URL("../web/checkpoint/index.html", import.meta.url).pathname, checkpointHtml),
]);
