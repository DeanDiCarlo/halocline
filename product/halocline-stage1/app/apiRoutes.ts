import {
  runCheckpointScenario,
  type CheckpointScenarioInput,
} from "../src/lib/checkpoint/checkpointScenarioRunner.ts";
import { buildMapShellViewModel } from "../src/lib/map/mapShellViewModel.ts";
import {
  buildMapScenarioViewModel,
  type MapScenarioInput,
} from "../src/lib/map/mapScenarioViewModel.ts";

const mapShellViewModel = buildMapShellViewModel();
const mapScenarioViewModel = buildMapScenarioViewModel();

function jsonResponse(statusCode: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function handleApiFetch(request: Request): Promise<Response> {
  const url = new URL(request.url);

  try {
    if (request.method === "GET" && url.pathname === "/api/map-shell") {
      return jsonResponse(200, mapShellViewModel);
    }

    if (request.method === "GET" && url.pathname === "/api/map-scenario") {
      return jsonResponse(200, mapScenarioViewModel);
    }

    if (request.method === "POST" && url.pathname === "/api/map-scenario") {
      const body = await request.text();
      const input = body.length > 0 ? (JSON.parse(body) as MapScenarioInput) : {};
      return jsonResponse(200, buildMapScenarioViewModel({ input }));
    }

    if (
      request.method === "GET" &&
      (url.pathname === "/api/scenario" || url.pathname === "/api/checkpoint")
    ) {
      return jsonResponse(200, runCheckpointScenario());
    }

    if (
      request.method === "POST" &&
      (url.pathname === "/api/scenario" || url.pathname === "/api/checkpoint")
    ) {
      const body = await request.text();
      const input = body.length > 0 ? (JSON.parse(body) as CheckpointScenarioInput) : {};
      return jsonResponse(200, runCheckpointScenario(input));
    }

    return jsonResponse(404, { error: "Not found" });
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "Unknown server error",
    });
  }
}
