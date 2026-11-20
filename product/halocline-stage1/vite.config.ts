import { defineConfig } from "vite";
import type { Connect } from "vite";
import { handleCheckpointRequest } from "./app/checkpointServer.ts";
import { resolveStaticPageRewrite } from "./app/staticPageRoutes.ts";

const rewriteStaticPageRoutes: Connect.NextHandleFunction = (request, _response, next) => {
  const rewrittenUrl = resolveStaticPageRewrite(request.url);
  if (rewrittenUrl) {
    request.url = rewrittenUrl;
  }
  next();
};

export default defineConfig({
  root: "web",
  publicDir: "../public",
  plugins: [
    {
      name: "halocline-api-dev-middleware",
      configureServer(server) {
        server.middlewares.use(rewriteStaticPageRoutes);
        server.middlewares.use((request, response, next) => {
          if (!request.url?.startsWith("/api")) {
            next();
            return;
          }

          handleCheckpointRequest(request, response).catch(next);
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use(rewriteStaticPageRoutes);
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
