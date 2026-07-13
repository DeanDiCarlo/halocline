import { marketingContent } from "./marketingContent.ts";

function renderCards(cards: readonly { title: string; body: string }[], className = "card"): string {
  return cards.map(({ title, body }) => `<article class="${className}"><h3>${title}</h3><p>${body}</p></article>`).join("");
}

const stakesCards = renderCards(marketingContent.stakes.cards);
const trustItems = renderCards(marketingContent.experience.trustItems, "trust-item");
const validationSteps = marketingContent.validation.steps
  .map(({ title, body, detail }, index) => `<article class="card approach-card"><span class="approach-index">0${index + 1}</span><h3>${title}</h3><p>${body}</p><span class="approach-detail">${detail}</span></article>`)
  .join("");
const metrics = marketingContent.validation.evidence.metrics
  .map(({ label, value, detail }) => `<div class="metric"><span>${label}</span><strong>${value}</strong><small>${detail}</small></div>`)
  .join("");
const executionCards = renderCards(marketingContent.execution.cards, "card execution-card");

export const marketingHtml = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Halocline | Coastal-aquifer planning research</title>
    <meta name="description" content="Halocline is a provisional coastal-aquifer planning instrument and digital-twin research platform." />
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
          <div class="nav-links"><a href="/research/">Research</a><a class="nav-action" href="/map/">Open map</a></div>
        </div>
      </nav>
      <main>
        <header class="hero" aria-labelledby="hero-title">
          <span class="hero-motif" aria-hidden="true"></span>
          <div class="hero-inner">
            <div class="hero-copy">
              <p class="eyebrow">${marketingContent.hero.eyebrow}</p>
              <h1 id="hero-title">${marketingContent.hero.title}</h1>
              <p class="hero-descriptor">${marketingContent.hero.descriptor}</p>
              <p class="lede">${marketingContent.hero.summary}</p>
              <p class="hero-evidence">${marketingContent.hero.evidenceCue}</p>
              <p class="hero-notice">${marketingContent.hero.disclaimer}</p>
              <div class="button-row"><a class="button button-primary" href="/map/">Open the scenario map</a><a class="button button-secondary" href="/research/">Explore the research</a></div>
            </div>
            <figure class="scientific-figure hero-figure">
              <img src="/assets/boundary_model.png" alt="Conceptual coastal-aquifer cross-section showing recharge, hydraulic head contours, interface depth, pumping wells, and the sea boundary." width="1448" height="1086" />
              <figcaption>Conceptual boundary conditions and the estimated freshwater-saltwater interface response.</figcaption>
            </figure>
          </div>
        </header>

        <section class="section section-light" aria-labelledby="stakes-title">
          <div class="section-inner">
            <div class="section-heading"><div><p class="eyebrow">The planning gap</p><h2 id="stakes-title">${marketingContent.stakes.title}</h2></div><p class="section-copy">${marketingContent.stakes.body}</p></div>
            <div class="card-grid">${stakesCards}</div>
          </div>
        </section>

        <section class="section section-ink experience-section" aria-labelledby="experience-title">
          <div class="section-inner">
            <div class="section-heading"><div><p class="eyebrow">Product experience</p><h2 id="experience-title">${marketingContent.experience.title}</h2></div><p class="section-copy">${marketingContent.experience.body}</p></div>
            <div class="experience-layout">
              <figure class="scientific-figure scenario-figure"><img src="/assets/scenario_surface.png" alt="Halocline scenario surface showing scenario inputs, spatial fields, head output, interface-depth output, and well-risk markers." width="987" height="980" /><figcaption>Static preview of the interactive Stage 1 scenario surface.</figcaption></figure>
              <aside class="trust-strip" aria-label="Product trust principles">${trustItems}</aside>
            </div>
          </div>
        </section>

        <section class="section section-light" aria-labelledby="validation-title">
          <div class="section-inner">
            <div class="section-heading"><div><p class="eyebrow">Validation path</p><h2 id="validation-title">${marketingContent.validation.title}</h2></div><p class="section-copy">${marketingContent.validation.body}</p></div>
            <div class="card-grid">${validationSteps}</div>
            <div class="evidence-panel" aria-labelledby="evidence-title">
              <div class="evidence-heading"><p class="eyebrow">Synthetic-oracle evaluation</p><h3 id="evidence-title">${marketingContent.validation.evidence.title}</h3><p>${marketingContent.validation.evidence.body}</p></div>
              <div class="evidence-layout">
                <div class="metric-grid" aria-label="Current surrogate research metrics">${metrics}</div>
                <figure class="scientific-figure evidence-figure"><img src="/assets/ufno_heatmap.png" alt="U-FNO held-out comparison heatmap showing synthetic physics oracle, surrogate prediction, and absolute error." width="1448" height="1086" /><figcaption>U-FNO prediction and error against the synthetic Stage 1 Python oracle on the held-out test set.</figcaption></figure>
              </div>
              <p class="evidence-caveat">${marketingContent.validation.evidence.caveat}</p>
              <p class="technical-link">For internal, technical inspection of the current Stage 1 calculations, visit the <a href="/checkpoint/">checkpoint</a>.</p>
            </div>
          </div>
        </section>

        <section class="section" aria-labelledby="execution-title">
          <div class="section-inner">
            <div class="section-heading"><div><p class="eyebrow">Proof of execution</p><h2 id="execution-title">${marketingContent.execution.title}</h2></div><p class="section-copy">${marketingContent.execution.body}</p></div>
            <div class="execution-grid">${executionCards}</div>
          </div>
        </section>

        <section class="section section-ink final-cta" aria-labelledby="demo-title">
          <div class="section-inner final-cta-inner">
            <div><p class="eyebrow">Stage 1</p><h2 id="demo-title">${marketingContent.finalCta.title}</h2><p>${marketingContent.finalCta.body}</p></div>
            <div class="button-row"><a class="button button-primary" href="/map/">Open the scenario map</a><a class="button button-secondary" href="/research/">Read the research</a></div>
          </div>
        </section>
      </main>
      <footer class="footer"><div class="footer-inner"><span class="footer-brand"><img src="/assets/halocline-mark.png" alt="" width="768" height="804" aria-hidden="true" />Halocline</span><span>Scenario-driven coastal-aquifer planning. Stage 1 is provisional and non-regulatory.</span><a class="footer-inspection-link" href="/checkpoint/">Technical inspection</a></div></footer>
    </div>
  </body>
</html>`;
