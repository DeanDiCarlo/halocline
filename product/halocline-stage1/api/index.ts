import type { IncomingMessage, ServerResponse } from "node:http";

import { handleCheckpointRequest } from "../app/checkpointServer.ts";

export default function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  return handleCheckpointRequest(request, response);
}
