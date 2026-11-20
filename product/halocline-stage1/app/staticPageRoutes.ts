export const staticPageRewrites: Readonly<Record<string, string>> = {
  "/map": "/map/index.html",
  "/checkpoint": "/checkpoint/index.html",
};

export function resolveStaticPageRewrite(requestUrl: string | undefined): string | undefined {
  if (!requestUrl) {
    return undefined;
  }

  const queryIndex = requestUrl.search(/[?#]/);
  const pathname = queryIndex === -1 ? requestUrl : requestUrl.slice(0, queryIndex);
  const target = staticPageRewrites[pathname];

  return target === undefined ? undefined : target + (queryIndex === -1 ? "" : requestUrl.slice(queryIndex));
}
