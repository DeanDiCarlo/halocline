import { marketingContent } from "./marketingContent.ts";

function renderCards(cards: readonly { title: string; body: string }[], className = "card"): string {
  return cards.map(({ title, body }) => `<article class="${className}"><h3>${title}</h3><p>${body}</p></article>`).join("");
}

const decisionCards = renderCards(marketingContent.decisionCards);
const approachCards = marketingContent.approach
  .map(({ title, body, detail }, index) => `<article class="card approach-card"><span class="approach-index">0${index + 1}</span><h3>${title}</h3><p>${body}</p><span class="approach-detail">${detail}</span></article>`)
  .join("");
const metrics = marketingContent.evidence.metrics
  .map(({ label, value, detail }) => `<div class="metric"><span>${label}</span><strong>${value}</strong><small>${detail}</small></div>`)
  .join("");
const commitmentCards = renderCards(marketingContent.commitment.cards);

export const marketingHtml = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Halocline | Coastal aquifer research</title>
    <meta name="description" content="Halocline research into faster, inspectable coastal-aquifer scenario analysis." />
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
          <div class="nav-links"><a href="#problem">Problem</a><a href="#approach">Approach</a><a href="#evidence">Evidence</a><a href="#research">Research</a><a href="/checkpoint">Checkpoint</a><a class="nav-action" href="/map">Open map</a></div>
        </div>
      </nav>
      <main>
        <header class="hero" aria-labelledby="hero-title">
          <span class="hero-motif" aria-hidden="true"></span>
          <div class="hero-inner">
            <div class="hero-copy">
              <p class="eyebrow">${marketingContent.hero.eyebrow}</p>
              <h1 id="hero-title">${marketingContent.hero.title}</h1>
              <p class="lede">${marketingContent.hero.summary}</p>
              <p class="hero-notice">${marketingContent.hero.disclaimer}</p>
              <div class="button-row"><a class="button button-primary" href="/map">Explore the scenario map</a><a class="button button-secondary" href="#approach">See the research approach</a></div>
            </div>
            <figure class="scientific-figure hero-figure">
              <img src="/assets/boundary_model.png" alt="Conceptual coastal-aquifer cross-section showing recharge, hydraulic head contours, interface depth, pumping wells, and the sea boundary." width="1448" height="1086" />
              <figcaption>Conceptual boundary conditions and freshwater-saltwater interface response.</figcaption>
            </figure>
          </div>
        </header>

        <section class="section section-light" id="problem" aria-labelledby="problem-title">
          <div class="section-inner">
            <div class="section-heading"><div><p class="eyebrow">The decision problem</p><h2 id="problem-title">Protecting freshwater requires choices before the boundary moves</h2></div><p class="section-copy">The public question is not whether a single scenario can be drawn. It is how a coastal aquifer responds across many plausible combinations of boundary conditions, while the consequences for wells remain understandable.</p></div>
            <div class="card-grid">${decisionCards}</div>
          </div>
        </section>

        <section class="section" id="approach" aria-labelledby="approach-title">
          <div class="section-inner">
            <div class="section-heading"><div><p class="eyebrow">Physics simulator to surrogate</p><h2 id="approach-title">Use transparent physics to decide where simulator time matters</h2></div><p class="section-copy">Stage 1 keeps its simplified calculation chain visible. The research track asks whether a surrogate can speed up the screening step without concealing what the current model does and does not represent.</p></div>
            <div class="card-grid">${approachCards}</div>
          </div>
        </section>

        <section class="section section-light" id="evidence" aria-labelledby="evidence-title">
          <div class="section-inner">
            <div class="section-heading"><div><p class="eyebrow">Synthetic experiment</p><h2 id="evidence-title">${marketingContent.evidence.title}</h2></div><p class="section-copy">${marketingContent.evidence.body}</p></div>
            <div class="evidence-layout">
              <div class="metric-grid" aria-label="Current experimental metrics">${metrics}</div>
              <figure class="scientific-figure evidence-figure"><img src="/assets/ufno_heatmap.png" alt="U-FNO held-out comparison heatmap showing synthetic physics oracle, surrogate prediction, and absolute error." width="1448" height="1086" /><figcaption>U-FNO prediction vs synthetic physics oracle, held-out test set. Metrics are against the simplified synthetic oracle, not observations.</figcaption></figure>
            </div>
          </div>
        </section>

        <section class="section section-ink" id="research" aria-labelledby="research-title">
          <div class="section-inner">
            <div class="section-heading"><div><p class="eyebrow">Working-paper direction</p><h2 id="research-title">${marketingContent.commitment.title}</h2></div><p class="section-copy">${marketingContent.commitment.body}</p></div>
            <div class="commitment-grid">${commitmentCards}</div>
            <a class="research-link" href="/research">Read research lineage and supporting references</a>
          </div>
        </section>

        <section class="section section-light" aria-labelledby="demo-title">
          <div class="section-inner demo-layout">
            <div class="demo-copy"><p class="eyebrow">Interactive demonstration</p><h2 id="demo-title">Inspect a provisional Stage 1 scenario</h2><p>The map exposes the scenario inputs, current calculation chain, diagnostics, and assumptions. It is a decision-support checkpoint, not a regulatory model of record.</p><div class="button-row"><a class="button button-primary" href="/map">Open scenario map</a><a class="button button-secondary" href="/checkpoint">Open checkpoint</a></div></div>
            <figure class="scientific-figure"><img src="/assets/scenario_surface.png" alt="Halocline scenario surface showing scenario inputs, spatial fields, head output, interface-depth output, and well-risk markers." width="987" height="980" /><figcaption>Static preview of the interactive Stage 1 scenario surface.</figcaption></figure>
          </div>
        </section>
      </main>
      <footer class="footer"><div class="footer-inner"><span class="footer-brand"><img src="/assets/halocline-mark.png" alt="" width="768" height="804" aria-hidden="true" />Halocline</span><span>Scenario-driven coastal-aquifer modeling. Stage 1 is provisional and non-regulatory.</span></div></footer>
    </div>
  </body>
</html>`;
