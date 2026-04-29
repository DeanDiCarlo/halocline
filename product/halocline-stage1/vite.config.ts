import { defineConfig } from "vite";
import { handleCheckpointRequest } from "./app/checkpointServer.ts";

export default defineConfig({
  root: "web",
  publicDir: "../public",
  plugins: [
    {
      name: "halocline-api-dev-middleware",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (!request.url?.startsWith("/api")) {
            next();
            return;
          }

          handleCheckpointRequest(request, response).catch(next);
        });
      },
    },
  ],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "web/index.html",
        map: "web/map/index.html",
        checkpoint: "web/checkpoint/index.html",
      },
    },
  },
});
