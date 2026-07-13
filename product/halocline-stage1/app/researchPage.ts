import { marketingContent } from "./marketingContent.ts";

const references = marketingContent.references
  .map(({ citation }) => `<li>${citation}</li>`)
  .join("");

export const researchHtml = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Halocline | Research references</title>
    <meta name="description" content="Halocline research lineage and supporting reference list." />
    <link rel="icon" href="/assets/halocline-mark.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/styles/tokens.css" />
    <link rel="stylesheet" href="/styles/base.css" />
    <link rel="stylesheet" href="/styles/marketing.css" />
  </head>
  <body>
    <div class="site-shell">
      <nav class="site-nav" aria-label="Primary navigation">
        <div class="nav-inner">
          <a class="nav-brand" href="/" aria-label="Halocline home"><img src="/assets/halocline-wordmark.png" alt="Halocline" width="1600" height="389" /></a>
          <div class="nav-links"><a href="/">Home</a><a href="/map/">Open map</a><a href="/checkpoint/">Checkpoint</a></div>
        </div>
      </nav>
      <main class="research-page">
        <header>
          <p class="eyebrow">Research supporting material</p>
          <h1>References and research lineage</h1>
          <p class="lede">This supporting list accompanies Halocline's provisional surrogate-research direction. It does not make the Stage 1 product a calibrated regulatory model.</p>
        </header>
        <section aria-labelledby="lineage-title">
          <p class="eyebrow">Working precedent</p>
          <h2 id="lineage-title">GeoFUSE, U-FNO, WNO, and graph-network directions</h2>
          <p class="section-copy">GeoFUSE pairs PFLOTRAN-generated seawater-intrusion simulations with U-FNO inference, PCA parameterization, and ESMDA data assimilation. Halocline uses that result as research precedent. Exploring whether WNO and GNN methods can better preserve spatial heterogeneity is a future research direction, not a demonstrated Halocline result.</p>
        </section>
        <section aria-labelledby="reference-title">
          <p class="eyebrow">Bibliography</p>
          <h2 id="reference-title">Supporting references</h2>
          <ul class="reference-grid">${references}</ul>
        </section>
      </main>
      <footer class="footer"><div class="footer-inner"><span class="footer-brand"><img src="/assets/halocline-mark.png" alt="" width="768" height="804" aria-hidden="true" />Halocline</span><span>Scenario-driven coastal-aquifer modeling. Stage 1 is provisional and non-regulatory.</span></div></footer>
    </div>
  </body>
</html>`;
