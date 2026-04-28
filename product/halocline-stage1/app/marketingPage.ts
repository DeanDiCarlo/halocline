export const marketingHtml = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Halocline | Coastal aquifer simulation</title>
    <meta
      name="description"
      content="Halocline estimates hydraulic head, freshwater-saltwater interface depth, and well-level intrusion risk under coastal-aquifer boundary-condition scenarios."
    />
    <link rel="icon" href="/assets/halocline-mark.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        color-scheme: light;
        --hal-ink: #0b1e2f;
        --hal-ink-700: #1e3448;
        --hal-ink-500: #345066;
        --hal-bone: #e8e1d1;
        --hal-bone-50: #f3eee0;
        --hal-bone-200: #d4cbb5;
        --hal-steel: #445e72;
        --hal-steel-400: #6b8296;
        --hal-steel-200: #a9b8c4;
        --hal-chloride: #c47838;
        --hal-chloride-600: #9e5e26;
        --hal-font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
        --hal-font-mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
        --line: rgba(11, 30, 47, 0.16);
        --line-strong: rgba(11, 30, 47, 0.32);
        --line-on-ink: rgba(232, 225, 209, 0.22);
        --muted: rgba(11, 30, 47, 0.68);
        --muted-on-ink: rgba(232, 225, 209, 0.7);
        --radius: 6px;
        --page-pad: clamp(18px, 4vw, 56px);
        --max-width: 1180px;
      }

      * {
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        background: var(--hal-bone);
        color: var(--hal-ink);
        font-family: var(--hal-font-sans);
        letter-spacing: 0;
      }

      body,
      button,
      input {
        font: 400 15px/1.6 var(--hal-font-sans);
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      img,
      svg {
        display: block;
        max-width: 100%;
      }

      a:focus-visible,
      button:focus-visible {
        outline: 2px solid var(--hal-chloride);
        outline-offset: 4px;
      }

      .site-shell {
        min-height: 100vh;
        overflow-x: hidden;
      }

      .site-nav {
        position: relative;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        min-height: 72px;
        padding: 14px var(--page-pad);
        background: rgba(232, 225, 209, 0.94);
        border-bottom: 1px solid var(--line);
      }

      .nav-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        width: min(100%, calc(var(--max-width) + 120px));
        margin: 0 auto;
      }

      .nav-brand {
        display: inline-flex;
        align-items: center;
        min-width: 164px;
      }

      .nav-brand img {
        width: 184px;
        height: auto;
      }

      .nav-links {
        display: flex;
        align-items: center;
        gap: 26px;
        color: var(--hal-steel);
        font-size: 13px;
        font-weight: 500;
      }

      .nav-links a {
        padding: 8px 0;
        border-bottom: 1px solid transparent;
        transition:
          color 140ms ease,
          border-color 140ms ease;
      }

      .nav-links a:hover {
        color: var(--hal-ink);
        border-color: var(--hal-chloride);
      }

      .nav-links .nav-action {
        min-height: 42px;
        padding: 9px 16px;
        color: var(--hal-bone);
        background: var(--hal-ink);
        border: 1px solid var(--hal-ink);
        border-radius: var(--radius);
      }

      .nav-links .nav-action:hover {
        color: var(--hal-bone-50);
        border-color: var(--hal-chloride);
      }

      .hero {
        position: relative;
        min-height: calc(100svh - 72px);
        isolation: isolate;
        display: flex;
        align-items: center;
        padding: 70px var(--page-pad) 0;
        overflow: hidden;
        background: var(--hal-bone);
      }

      .hero::after {
        content: "";
        position: absolute;
        right: -150px;
        bottom: -112px;
        z-index: -2;
        width: min(56vw, 760px);
        min-width: 420px;
        aspect-ratio: 1;
        background: url("/assets/halocline-mark.png") center / contain no-repeat;
        opacity: 0.16;
      }

      .hero-scene {
        position: absolute;
        inset: auto 0 0;
        z-index: -1;
        height: 36%;
        background: var(--hal-ink);
        border-top: 1px solid var(--line-strong);
      }

      .hero-scene::before {
        content: "";
        position: absolute;
        right: -4vw;
        bottom: 12%;
        width: min(66vw, 960px);
        height: 64%;
        background: var(--hal-chloride);
        clip-path: polygon(20% 78%, 62% 55%, 100% 30%, 100% 100%, 0 100%);
        opacity: 0.82;
      }

      .hero-scene::after {
        content: "";
        position: absolute;
        right: 0;
        left: 38%;
        bottom: 35%;
        height: 1px;
        background: var(--hal-chloride);
      }

      .hero-line {
        position: absolute;
        right: 0;
        left: 42%;
        height: 2px;
        border-top: 2px dashed rgba(68, 94, 114, 0.72);
      }

      .hero-line.one {
        top: 17%;
        opacity: 0.5;
      }

      .hero-line.two {
        top: 34%;
        opacity: 0.7;
      }

      .hero-line.three {
        top: 51%;
        opacity: 0.9;
      }

      .hero-inner {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(360px, 0.72fr);
        gap: 44px;
        align-items: center;
        width: min(100%, var(--max-width));
        margin: 0 auto;
        padding-bottom: 38px;
      }

      .hero-copy-block {
        width: min(100%, 650px);
        margin-bottom: 42px;
      }

      .label {
        margin: 0 0 16px;
        color: var(--hal-steel);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0;
        line-height: 1.2;
        text-transform: uppercase;
      }

      .hero .label {
        color: var(--hal-steel);
      }

      h1,
      h2,
      h3,
      p {
        margin-top: 0;
      }

      h1 {
        margin: 0 0 22px;
        max-width: 560px;
        font-size: 76px;
        font-weight: 500;
        line-height: 0.96;
      }

      .hero-copy {
        width: min(100%, 640px);
        margin: 0 0 26px;
        color: var(--hal-ink-700);
        font-size: 18px;
        line-height: 1.62;
      }

      .hero-visual {
        align-self: stretch;
        min-height: 520px;
        display: flex;
        align-items: center;
      }

      .hero-actions,
      .cta-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 18px;
        border: 1px solid var(--line-strong);
        border-radius: var(--radius);
        font-size: 14px;
        font-weight: 600;
        transition:
          background 140ms ease,
          border-color 140ms ease,
          color 140ms ease,
          transform 140ms ease;
      }

      .button:hover {
        transform: translateY(-1px);
      }

      .button-primary {
        color: var(--hal-bone);
        background: var(--hal-ink);
        border-color: var(--hal-ink);
      }

      .button-primary:hover {
        background: var(--hal-ink-700);
        border-color: var(--hal-chloride);
      }

      .button-secondary {
        color: var(--hal-ink);
        background: transparent;
      }

      .button-secondary:hover {
        border-color: var(--hal-chloride);
      }

      .hero-readout {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        color: var(--hal-bone);
        background: rgba(11, 30, 47, 0.82);
        border: 1px solid var(--line-on-ink);
      }

      .readout-cell {
        min-height: 110px;
        padding: 20px;
        border-right: 1px solid var(--line-on-ink);
      }

      .readout-cell:last-child {
        border-right: 0;
      }

      .readout-label {
        display: block;
        margin-bottom: 12px;
        color: var(--muted-on-ink);
        font-size: 12px;
      }

      .readout-value {
        display: block;
        font-family: var(--hal-font-mono);
        font-size: 18px;
        font-weight: 500;
        line-height: 1.25;
      }

      .scientific-image-frame {
        display: grid;
        gap: 14px;
        width: 100%;
      }

      .scientific-image {
        position: relative;
        display: grid;
        place-items: center;
        width: 100%;
        min-height: 360px;
        aspect-ratio: 4 / 3;
        overflow: hidden;
        color: var(--hal-ink);
        border: 1px solid var(--line-strong);
        background:
          linear-gradient(90deg, rgba(68, 94, 114, 0.12) 1px, transparent 1px),
          linear-gradient(0deg, rgba(68, 94, 114, 0.12) 1px, transparent 1px),
          var(--hal-bone-50);
        background-size: 42px 42px;
      }

      .section-ink .scientific-image {
        color: var(--hal-bone);
        border-color: var(--line-on-ink);
        background:
          linear-gradient(90deg, rgba(232, 225, 209, 0.12) 1px, transparent 1px),
          linear-gradient(0deg, rgba(232, 225, 209, 0.12) 1px, transparent 1px),
          rgba(232, 225, 209, 0.05);
        background-size: 42px 42px;
      }

      .scientific-image.is-placeholder::before {
        content: "";
        position: absolute;
        inset: 18px;
        border: 1px dashed rgba(196, 120, 56, 0.72);
      }

      .scientific-image img {
        width: 100%;
        height: 100%;
        max-height: min(72vh, 720px);
        object-fit: contain;
      }

      .hero-visual .scientific-image img {
        max-height: min(68vh, 620px);
      }

      .scenario-map-panel .scientific-image,
      .chart-panel .scientific-image {
        min-height: clamp(320px, 48vw, 620px);
      }

      .image-caption,
      .feature-labels li {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
      }

      .section-ink .image-caption,
      .section-ink .feature-labels li {
        color: var(--muted-on-ink);
      }

      .feature-labels {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .feature-labels li {
        padding: 6px 8px;
        border: 1px solid var(--line);
        background: rgba(243, 238, 224, 0.58);
      }

      .section-ink .feature-labels li {
        border-color: var(--line-on-ink);
        background: rgba(232, 225, 209, 0.06);
      }

      .image-caption {
        margin: 0;
      }

      .trust-strip {
        background: var(--hal-ink);
        color: var(--hal-bone);
        border-bottom: 1px solid var(--line-on-ink);
      }

      .trust-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        border-left: 1px solid var(--line-on-ink);
      }

      .trust-item {
        min-height: 156px;
        padding: 28px;
        border-right: 1px solid var(--line-on-ink);
      }

      .trust-item strong {
        display: block;
        margin-bottom: 10px;
        font-size: 18px;
        font-weight: 600;
      }

      .trust-item span {
        display: block;
        color: var(--muted-on-ink);
        font-size: 14px;
        line-height: 1.55;
      }

      .section {
        padding: 86px var(--page-pad);
        border-bottom: 1px solid var(--line);
      }

      .section-ink {
        background: var(--hal-ink);
        color: var(--hal-bone);
      }

      .section-light {
        background: var(--hal-bone-50);
      }

      .section-inner {
        width: min(100%, var(--max-width));
        margin: 0 auto;
      }

      .section-heading {
        display: grid;
        grid-template-columns: minmax(0, 0.86fr) minmax(280px, 0.76fr);
        gap: 58px;
        align-items: end;
        margin-bottom: 48px;
      }

      .section-heading h2,
      .preview-copy h2,
      .cta-copy h2 {
        margin: 0;
        font-size: 54px;
        font-weight: 500;
        line-height: 1.02;
      }

      .section-heading p,
      .preview-copy p,
      .cta-copy p {
        margin: 0;
        color: var(--muted);
        font-size: 17px;
        line-height: 1.65;
      }

      .section-ink .label,
      .section-ink .section-heading p,
      .section-ink .preview-copy p,
      .section-ink .cta-copy p {
        color: var(--muted-on-ink);
      }

      .workflow-frame {
        display: grid;
        grid-template-columns: minmax(240px, 0.7fr) minmax(0, 1.3fr);
        border: 1px solid var(--line);
        background: var(--hal-bone);
      }

      .workflow-index-panel {
        padding: 28px;
        border-right: 1px solid var(--line);
      }

      .workflow-index-panel strong {
        display: block;
        margin-bottom: 18px;
        font-size: 20px;
        font-weight: 600;
      }

      .workflow-index-panel p {
        margin: 0 0 22px;
        color: var(--muted);
        font-size: 14px;
      }

      .workflow-meter {
        display: grid;
        gap: 10px;
      }

      .meter-row {
        display: grid;
        grid-template-columns: 92px 1fr auto;
        gap: 12px;
        align-items: center;
        color: var(--hal-steel);
        font-size: 12px;
      }

      .meter-track {
        height: 8px;
        background: rgba(68, 94, 114, 0.16);
      }

      .meter-fill {
        display: block;
        height: 100%;
        background: var(--hal-ink);
      }

      .meter-fill.chloride {
        background: var(--hal-chloride);
      }

      .workflow-steps {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
      }

      .workflow-step {
        position: relative;
        min-height: 300px;
        padding: 28px 24px;
        border-right: 1px solid var(--line);
      }

      .workflow-step:last-child {
        border-right: 0;
      }

      .workflow-step::after {
        content: "";
        position: absolute;
        right: 24px;
        bottom: 24px;
        left: 24px;
        height: 1px;
        background: var(--line);
      }

      .workflow-index {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        margin-bottom: 44px;
        color: var(--hal-chloride-600);
        font-family: var(--hal-font-mono);
        font-size: 13px;
        border: 1px solid rgba(196, 120, 56, 0.5);
        border-radius: 999px;
      }

      .workflow-step h3 {
        margin: 0 0 12px;
        font-size: 20px;
        font-weight: 600;
        line-height: 1.18;
      }

      .workflow-step p {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.55;
      }

      .step-mark {
        display: block;
        height: 44px;
        margin-top: 24px;
      }

      .step-mark svg {
        width: 100%;
        height: 100%;
      }

      .model-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.72fr);
        gap: 28px;
        align-items: stretch;
      }

      .aquifer-diagram {
        min-height: 560px;
        border: 1px solid var(--line-strong);
        background: var(--hal-bone-50);
      }

      .aquifer-diagram svg {
        width: 100%;
        height: 100%;
        min-height: 560px;
      }

      .diagram-label {
        fill: var(--hal-ink);
        font-family: var(--hal-font-sans);
        font-size: 14px;
        font-weight: 600;
      }

      .diagram-note {
        fill: var(--hal-steel);
        font-family: var(--hal-font-mono);
        font-size: 12px;
      }

      .model-cells {
        display: grid;
        gap: 16px;
      }

      .model-cell {
        min-height: 176px;
        padding: 24px;
        border: 1px solid var(--line);
        background: rgba(243, 238, 224, 0.6);
      }

      .model-cell h3 {
        margin: 0 0 12px;
        font-size: 21px;
        font-weight: 600;
      }

      .model-cell p {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.58;
      }

      .data-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 14px;
        align-items: end;
        margin-top: 22px;
        padding-top: 16px;
        border-top: 1px solid var(--line);
        color: var(--hal-steel);
        font-size: 12px;
      }

      .data-value {
        color: var(--hal-ink);
        font-family: var(--hal-font-mono);
        font-size: 15px;
        font-weight: 500;
        white-space: nowrap;
      }

      .product-preview {
        display: grid;
        grid-template-columns: minmax(280px, 0.54fr) minmax(0, 1fr);
        gap: 34px;
        align-items: stretch;
      }

      .preview-copy {
        padding: 18px 0 0;
      }

      .preview-copy h2 {
        margin-bottom: 22px;
      }

      .preview-copy .button {
        margin-top: 28px;
        color: var(--hal-bone);
        border-color: var(--line-on-ink);
      }

      .preview-copy .button:hover {
        border-color: var(--hal-chloride);
      }

      .product-console {
        display: grid;
        grid-template-columns: 190px minmax(0, 1fr) 230px;
        min-height: 520px;
        border: 1px solid var(--line-on-ink);
        background: var(--hal-bone);
        color: var(--hal-ink);
      }

      .console-rail,
      .evidence-rail {
        padding: 18px;
        background: var(--hal-bone-50);
      }

      .console-rail {
        border-right: 1px solid var(--line);
      }

      .evidence-rail {
        border-left: 1px solid var(--line);
      }

      .console-label {
        display: block;
        margin-bottom: 14px;
        color: var(--hal-steel);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .control-stack {
        display: grid;
        gap: 14px;
      }

      .control-row {
        padding-bottom: 14px;
        border-bottom: 1px solid var(--line);
      }

      .control-row span {
        display: block;
        color: var(--hal-steel);
        font-size: 12px;
      }

      .control-row strong {
        display: block;
        margin-top: 5px;
        font-family: var(--hal-font-mono);
        font-size: 18px;
        font-weight: 500;
      }

      .scenario-map-panel {
        position: relative;
        min-height: 520px;
        overflow: hidden;
        background: var(--hal-bone);
      }

      .scenario-map-panel svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .map-title {
        position: absolute;
        top: 18px;
        left: 18px;
        z-index: 1;
        color: var(--hal-ink);
      }

      .map-title strong,
      .map-title span {
        display: block;
      }

      .map-title span {
        color: var(--hal-steel);
        font-family: var(--hal-font-mono);
        font-size: 11px;
      }

      .map-legend {
        position: absolute;
        right: 16px;
        bottom: 16px;
        z-index: 1;
        display: grid;
        gap: 8px;
        min-width: 184px;
        padding: 12px;
        background: rgba(243, 238, 224, 0.9);
        border: 1px solid var(--line);
      }

      .legend-row {
        display: grid;
        grid-template-columns: 20px 1fr;
        gap: 8px;
        align-items: center;
        color: var(--hal-steel);
        font-size: 11px;
      }

      .legend-swatch {
        width: 20px;
        height: 3px;
        background: var(--hal-ink);
      }

      .legend-swatch.chloride {
        height: 8px;
        background: var(--hal-chloride);
      }

      .legend-swatch.dashed {
        border-top: 2px dashed var(--hal-steel);
        background: transparent;
      }

      .evidence-card {
        padding: 14px 0;
        border-bottom: 1px solid var(--line);
      }

      .evidence-card:first-of-type {
        padding-top: 0;
      }

      .evidence-card strong {
        display: block;
        font-size: 14px;
        font-weight: 600;
      }

      .evidence-card span {
        display: block;
        margin-top: 6px;
        color: var(--hal-steel);
        font-size: 12px;
        line-height: 1.45;
      }

      .evidence-number {
        color: var(--hal-chloride-600);
        font-family: var(--hal-font-mono);
      }

      .evidence-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        border-top: 1px solid var(--line);
        border-left: 1px solid var(--line);
      }

      .evidence-item {
        min-height: 230px;
        padding: 28px;
        border-right: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        background: rgba(243, 238, 224, 0.44);
      }

      .evidence-item h3 {
        margin: 0 0 16px;
        font-size: 20px;
        font-weight: 600;
      }

      .evidence-item p {
        margin: 0;
        color: var(--muted);
        line-height: 1.62;
      }

      .evidence-meta {
        display: grid;
        gap: 9px;
        margin-top: 24px;
        font-family: var(--hal-font-mono);
        font-size: 12px;
      }

      .evidence-meta span {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        padding-top: 8px;
        border-top: 1px solid var(--line);
        color: var(--hal-steel);
      }

      .evidence-meta strong {
        color: var(--hal-ink);
        font-weight: 500;
      }

      .research-thesis {
        display: grid;
        grid-template-columns: minmax(0, 0.95fr) minmax(320px, 0.78fr);
        gap: 34px;
        align-items: stretch;
      }

      .research-panel {
        padding: 28px;
        border: 1px solid var(--line);
        background: rgba(243, 238, 224, 0.54);
      }

      .research-panel h3,
      .study-card h3,
      .paper-card h3,
      .roadmap-card h3 {
        margin: 0 0 12px;
        font-size: 21px;
        font-weight: 600;
        line-height: 1.18;
      }

      .research-panel p,
      .study-card p,
      .paper-card p,
      .roadmap-card p {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.62;
      }

      .research-kpis {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        border-top: 1px solid var(--line);
        border-left: 1px solid var(--line);
      }

      .research-kpi {
        min-height: 142px;
        padding: 20px;
        border-right: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
      }

      .research-kpi span {
        display: block;
        color: var(--hal-steel);
        font-size: 12px;
      }

      .research-kpi strong {
        display: block;
        margin-top: 10px;
        font-family: var(--hal-font-mono);
        font-size: 24px;
        font-weight: 500;
        line-height: 1.15;
      }

      .research-kpi em {
        display: block;
        margin-top: 8px;
        color: var(--muted);
        font-size: 12px;
        font-style: normal;
        line-height: 1.45;
      }

      .paper-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }

      .paper-card {
        min-height: 224px;
        padding: 22px;
        color: var(--hal-bone);
        border: 1px solid var(--line-on-ink);
        background: rgba(232, 225, 209, 0.05);
      }

      .paper-card p,
      .paper-card a {
        color: var(--muted-on-ink);
      }

      .paper-card a {
        display: inline-flex;
        margin-top: 16px;
        font-size: 13px;
        font-weight: 600;
        border-bottom: 1px solid rgba(196, 120, 56, 0.72);
      }

      .reference-list {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-top: 28px;
      }

      .reference-list span {
        padding: 10px 12px;
        color: var(--muted-on-ink);
        font-size: 12px;
        line-height: 1.35;
        border: 1px solid rgba(232, 225, 209, 0.14);
      }

      .study-grid {
        display: grid;
        grid-template-columns: minmax(300px, 0.84fr) minmax(0, 1fr);
        gap: 24px;
        align-items: stretch;
      }

      .study-card {
        padding: 24px;
        border: 1px solid var(--line);
        background: rgba(243, 238, 224, 0.56);
      }

      .study-card + .study-card {
        margin-top: 16px;
      }

      .data-schema {
        display: grid;
        gap: 10px;
        margin-top: 20px;
      }

      .schema-row {
        display: grid;
        grid-template-columns: 128px 1fr;
        gap: 12px;
        padding-top: 10px;
        border-top: 1px solid var(--line);
        color: var(--hal-steel);
        font-size: 12px;
      }

      .schema-row strong {
        color: var(--hal-ink);
        font-family: var(--hal-font-mono);
        font-weight: 500;
      }

      .chart-panel {
        display: grid;
        gap: 18px;
        padding: 24px;
        border: 1px solid var(--line-strong);
        background: var(--hal-bone);
      }

      .chart-title {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 16px;
      }

      .chart-title strong {
        font-size: 18px;
      }

      .chart-title span {
        color: var(--hal-steel);
        font-family: var(--hal-font-mono);
        font-size: 12px;
      }

      .ufno-placeholder {
        aspect-ratio: 16 / 9;
        min-height: 420px;
      }

      .bar-chart {
        display: grid;
        gap: 12px;
      }

      .bar-row {
        display: grid;
        grid-template-columns: 118px 1fr 82px;
        gap: 12px;
        align-items: center;
        color: var(--hal-steel);
        font-size: 12px;
      }

      .bar-track {
        height: 12px;
        background: rgba(68, 94, 114, 0.14);
      }

      .bar-fill {
        display: block;
        height: 100%;
        background: var(--hal-ink);
      }

      .bar-fill.chloride {
        background: var(--hal-chloride);
      }

      .bar-value {
        color: var(--hal-ink);
        font-family: var(--hal-font-mono);
        text-align: right;
      }

      .roadmap-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }

      .roadmap-card {
        min-height: 246px;
        padding: 24px;
        border: 1px solid var(--line);
        background: rgba(243, 238, 224, 0.52);
      }

      .roadmap-index {
        display: inline-flex;
        margin-bottom: 34px;
        color: var(--hal-chloride-600);
        font-family: var(--hal-font-mono);
        font-size: 13px;
      }

      .cta-band {
        position: relative;
        overflow: hidden;
      }

      .cta-band::after {
        content: "";
        position: absolute;
        right: -90px;
        bottom: -150px;
        width: 430px;
        aspect-ratio: 1;
        background: url("/assets/halocline-mark.png") center / contain no-repeat;
        opacity: 0.18;
      }

      .cta-grid {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 34px;
        align-items: end;
      }

      .cta-copy h2 {
        max-width: 800px;
        margin-bottom: 20px;
      }

      .section-ink .button-primary {
        color: var(--hal-ink);
        background: var(--hal-bone);
        border-color: var(--hal-bone);
      }

      .section-ink .button-primary:hover {
        background: var(--hal-bone-50);
      }

      .section-ink .button-secondary {
        color: var(--hal-bone);
        border-color: var(--line-on-ink);
      }

      .footer {
        padding: 28px var(--page-pad);
        background: var(--hal-ink);
        color: var(--muted-on-ink);
        border-top: 1px solid var(--line-on-ink);
      }

      .footer-inner {
        width: min(100%, var(--max-width));
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        font-size: 12px;
      }

      .footer-brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: var(--hal-bone);
        font-weight: 600;
      }

      .footer-brand img {
        width: 38px;
        height: auto;
      }

      @media (max-width: 1040px) {
        .section-heading,
        .hero-inner,
        .workflow-frame,
        .model-grid,
        .product-preview,
        .research-thesis,
        .study-grid,
        .cta-grid {
          grid-template-columns: 1fr;
        }

        .paper-grid,
        .reference-list,
        .roadmap-grid {
          grid-template-columns: 1fr 1fr;
        }

        .product-console {
          grid-template-columns: 170px 1fr;
        }

        .evidence-rail {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border-top: 1px solid var(--line);
          border-left: 0;
        }

        .evidence-card {
          padding: 0 14px;
          border-right: 1px solid var(--line);
          border-bottom: 0;
        }

        .evidence-card:last-child {
          border-right: 0;
        }
      }

      @media (max-width: 820px) {
        .nav-links {
          display: none;
        }

        .nav-brand img {
          width: 166px;
        }

        .hero {
          min-height: auto;
          padding-top: 58px;
        }

        .hero::after {
          right: -190px;
          opacity: 0.12;
        }

        .hero-copy-block {
          margin-bottom: 34px;
        }

        h1 {
          font-size: 58px;
        }

        .hero-copy {
          font-size: 17px;
        }

        .hero-visual {
          min-height: 360px;
        }

        .hero-readout,
        .trust-grid,
        .workflow-steps,
        .evidence-grid,
        .research-kpis,
        .paper-grid,
        .reference-list,
        .roadmap-grid {
          grid-template-columns: 1fr;
        }

        .readout-cell,
        .trust-item,
        .workflow-step,
        .evidence-item {
          min-height: auto;
          border-right: 0;
          border-bottom: 1px solid var(--line-on-ink);
        }

        .section {
          padding: 64px var(--page-pad);
        }

        .section-heading h2,
        .preview-copy h2,
        .cta-copy h2 {
          font-size: 38px;
        }

        .workflow-index-panel {
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }

        .workflow-steps {
          display: block;
        }

        .workflow-step {
          min-height: 248px;
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }

        .product-console {
          grid-template-columns: 1fr;
        }

        .console-rail,
        .evidence-rail {
          border: 0;
          border-bottom: 1px solid var(--line);
        }

        .evidence-rail {
          display: block;
        }

        .evidence-card {
          padding: 14px 0;
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }

        .scenario-map-panel {
          min-height: 430px;
        }

        .footer-inner {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 560px) {
        .site-nav {
          min-height: 66px;
        }

        .hero {
          padding-top: 44px;
        }

        h1 {
          font-size: 54px;
        }

        .hero-copy {
          font-size: 18px;
        }

        .hero-actions,
        .cta-actions {
          flex-direction: column;
          align-items: stretch;
        }

        .button {
          width: 100%;
        }

        .meter-row {
          grid-template-columns: 78px 1fr auto;
        }

        .schema-row,
        .bar-row {
          grid-template-columns: 1fr;
        }

        .bar-value {
          text-align: left;
        }

        .aquifer-diagram,
        .aquifer-diagram svg,
        .scientific-image {
          min-height: 500px;
        }

        .map-legend {
          position: static;
          margin: 340px 14px 14px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          scroll-behavior: auto !important;
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="site-shell">
      <nav class="site-nav" aria-label="Primary navigation">
        <div class="nav-inner">
          <a class="nav-brand" href="/" aria-label="Halocline home">
            <img src="/assets/halocline-wordmark.png" alt="Halocline" width="1600" height="389" />
          </a>
          <div class="nav-links">
            <a href="#platform">Platform</a>
            <a href="#model">Model</a>
            <a href="#evidence">Evidence</a>
            <a href="#research">Research</a>
            <a href="/checkpoint">Checkpoint</a>
            <a class="nav-action" href="/map">Open map</a>
          </div>
        </div>
      </nav>

      <header class="hero" aria-labelledby="hero-title">
        <div class="hero-scene" aria-hidden="true">
          <span class="hero-line one"></span>
          <span class="hero-line two"></span>
          <span class="hero-line three"></span>
        </div>
        <div class="hero-inner">
          <div class="hero-copy-block">
            <p class="label">Coastal aquifer boundary-response model</p>
            <h1 id="hero-title">Halocline</h1>
            <p class="hero-copy">
              A scenario-driven model for estimating hydraulic head, freshwater-saltwater interface
              depth, and well-level intrusion risk under variable recharge, sea-level, canal-stage,
              and pumping boundary conditions.
            </p>
            <div class="hero-actions">
              <a class="button button-primary" href="/map">Open scenario map</a>
              <a class="button button-secondary" href="#model">Review governing assumptions</a>
            </div>
          </div>

          <figure class="hero-visual scientific-image-frame" aria-label="Conceptual coastal-aquifer cross-section">
            <div class="scientific-image">
              <img
                src="/assets/boundary_model.png"
                alt="Conceptual coastal-aquifer cross-section labeled with recharge, hydraulic head contours, interface depth, pumping wells, and sea boundary."
                width="1448"
                height="1086"
              />
            </div>
            <figcaption class="image-caption">
              Conceptual cross-section of boundary conditions and freshwater-saltwater interface response.
            </figcaption>
          </figure>

          <div class="hero-readout" aria-label="Stage 1 model summary">
            <div class="readout-cell">
              <span class="readout-label">Model stage</span>
              <span class="readout-value">Stage 1</span>
            </div>
            <div class="readout-cell">
              <span class="readout-label">Reference area</span>
              <span class="readout-value">Biscayne / Miami-Dade</span>
            </div>
            <div class="readout-cell">
              <span class="readout-label">Reference context</span>
              <span class="readout-value">USGS + SFWMD</span>
            </div>
            <div class="readout-cell">
              <span class="readout-label">Primary output</span>
              <span class="readout-value">Head field, interface depth, risk ratio</span>
            </div>
          </div>
        </div>
      </header>

      <section class="trust-strip" aria-label="Trust signals">
        <div class="section-inner trust-grid">
          <div class="trust-item">
            <strong>Process-based</strong>
            <span>Steady-state Darcy flow, Ghyben-Herzberg interface approximation, and well-level upconing risk estimates.</span>
          </div>
          <div class="trust-item">
            <strong>Reference context</strong>
            <span>USGS isochlor lines and SFWMD canal alignments remain distinct from model-derived grids.</span>
          </div>
          <div class="trust-item">
            <strong>Model limits</strong>
            <span>Stage 1 is a provisional decision-support model, not a calibrated regulatory model of record.</span>
          </div>
        </div>
      </section>

      <main>
        <section class="section section-light" id="platform" aria-labelledby="platform-title">
          <div class="section-inner">
            <div class="section-heading">
              <div>
                <p class="label">Numerical workflow</p>
                <h2 id="platform-title">From boundary conditions to aquifer response</h2>
              </div>
              <p>
                Halocline exposes each modeling step: boundary conditions are parameterized,
                the hydraulic head field is solved, interface position is estimated, and well-level
                intrusion risk is reported with diagnostics.
              </p>
            </div>

            <div class="workflow-frame">
              <aside class="workflow-index-panel" aria-label="Boundary-condition summary">
                <strong>Boundary-condition set</strong>
                <p>Example scenario with reduced recharge, elevated coastal head, and increased central wellfield withdrawals.</p>
                <div class="workflow-meter" aria-label="Scenario inputs">
                  <div class="meter-row">
                    <span>Recharge</span>
                    <span class="meter-track"><span class="meter-fill" style="width: 64%"></span></span>
                    <strong>0.82x</strong>
                  </div>
                  <div class="meter-row">
                    <span>Sea level</span>
                    <span class="meter-track"><span class="meter-fill chloride" style="width: 44%"></span></span>
                    <strong>+0.38 m</strong>
                  </div>
                  <div class="meter-row">
                    <span>Pumping</span>
                    <span class="meter-track"><span class="meter-fill" style="width: 78%"></span></span>
                    <strong>+Q</strong>
                  </div>
                </div>
              </aside>

              <div class="workflow-steps">
                <article class="workflow-step">
                  <span class="workflow-index">01</span>
                  <h3>Define boundary conditions</h3>
                  <p>Set recharge, coastal head, canal stage, and pumping terms for the scenario domain.</p>
                  <span class="step-mark" aria-hidden="true">
                    <svg viewBox="0 0 160 50">
                      <path d="M6 38 H154" stroke="#0b1e2f" stroke-width="1" opacity="0.24" />
                      <rect x="18" y="14" width="24" height="24" fill="#0b1e2f" opacity="0.16" />
                      <rect x="66" y="8" width="24" height="30" fill="#c47838" opacity="0.78" />
                      <rect x="114" y="20" width="24" height="18" fill="#445e72" opacity="0.34" />
                    </svg>
                  </span>
                </article>
                <article class="workflow-step">
                  <span class="workflow-index">02</span>
                  <h3>Solve hydraulic head field</h3>
                  <p>Solve the steady-state Darcy flow field over the active grid and retain mass-balance diagnostics.</p>
                  <span class="step-mark" aria-hidden="true">
                    <svg viewBox="0 0 160 50">
                      <path d="M8 34 C38 12 68 38 96 20 C116 8 134 18 152 10" fill="none" stroke="#0b1e2f" stroke-width="3" />
                      <path d="M8 42 C40 28 68 44 98 30 C122 18 138 28 152 22" fill="none" stroke="#c47838" stroke-width="3" opacity="0.85" />
                    </svg>
                  </span>
                </article>
                <article class="workflow-step">
                  <span class="workflow-index">03</span>
                  <h3>Compute interface depth</h3>
                  <p>Use the Ghyben-Herzberg approximation to convert freshwater head into a sharp-interface depth estimate.</p>
                  <span class="step-mark" aria-hidden="true">
                    <svg viewBox="0 0 160 50">
                      <path d="M6 30 C46 22 86 28 154 12" fill="none" stroke="#445e72" stroke-width="2" stroke-dasharray="8 8" />
                      <path d="M6 40 C46 35 86 42 154 26" fill="none" stroke="#c47838" stroke-width="4" />
                    </svg>
                  </span>
                </article>
                <article class="workflow-step">
                  <span class="workflow-index">04</span>
                  <h3>Evaluate well intrusion risk</h3>
                  <p>Estimate critical pumping and risk ratio for each placeholder wellfield under the solved head field.</p>
                  <span class="step-mark" aria-hidden="true">
                    <svg viewBox="0 0 160 50">
                      <path d="M16 13 H144 M16 25 H118 M16 37 H138" stroke="#0b1e2f" stroke-width="2" opacity="0.55" />
                      <circle cx="144" cy="13" r="5" fill="#c47838" />
                      <circle cx="118" cy="25" r="5" fill="#445e72" />
                      <circle cx="138" cy="37" r="5" fill="#0b1e2f" />
                    </svg>
                  </span>
                </article>
                <article class="workflow-step">
                  <span class="workflow-index">05</span>
                  <h3>Attach assumptions and diagnostics</h3>
                  <p>Report convergence status, mass-balance residual, active guardrails, and non-regulatory model limitations.</p>
                  <span class="step-mark" aria-hidden="true">
                    <svg viewBox="0 0 160 50">
                      <path d="M22 14 H138 M22 25 H126 M22 36 H146" stroke="#0b1e2f" stroke-width="2" opacity="0.55" />
                      <path d="M14 14 L17 17 L22 9 M14 25 L17 28 L22 20 M14 36 L17 39 L22 31" fill="none" stroke="#c47838" stroke-width="2" />
                    </svg>
                  </span>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section class="section" id="model" aria-labelledby="model-title">
          <div class="section-inner">
            <div class="section-heading">
              <div>
                <p class="label">Boundary model</p>
                <h2 id="model-title">A simplified coastal-aquifer model with visible boundary assumptions</h2>
              </div>
              <p>
                The current model represents a two-dimensional active grid, fixed-head coastal
                and canal boundaries, distributed recharge, pumping wells, and a provisional
                aquifer-base clamp used for display.
              </p>
            </div>

            <div class="model-grid">
              <div class="aquifer-diagram" aria-label="Labeled halocline aquifer cross-section">
                <div class="scientific-image">
                  <img
                    src="/assets/boundary_model.png"
                    alt="Conceptual cross-section showing recharge, hydraulic head contours, interface depth, pumping wells, and sea boundary."
                    width="1448"
                    height="1086"
                  />
                </div>
              </div>

              <div class="model-cells">
                <article class="model-cell">
                  <h3>Steady flow solve</h3>
                  <p>Solves the two-dimensional steady-state Darcy flow equation over the active model grid.</p>
                  <div class="data-row">
                    <span>solver unit</span>
                    <span class="data-value">m / day</span>
                  </div>
                </article>
                <article class="model-cell">
                  <h3>Interface depth</h3>
                  <p>Converts freshwater head to a sharp-interface estimate using the Ghyben-Herzberg approximation.</p>
                  <div class="data-row">
                    <span>readout</span>
                    <span class="data-value">depth m</span>
                  </div>
                </article>
                <article class="model-cell">
                  <h3>Intrusion risk</h3>
                  <p>Computes well-level pumping stress, critical pumping, and risk ratio for each placeholder wellfield.</p>
                  <div class="data-row">
                    <span>ranking</span>
                    <span class="data-value">risk ratio</span>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section class="section section-ink" aria-label="Scenario parameterization and spatial outputs">
          <div class="section-inner product-preview">
            <div class="preview-copy">
              <p class="label">Scenario parameterization</p>
              <h2>Scenario parameterization and spatial outputs</h2>
              <p>
                Inputs combine scalar controls and spatial fields: recharge multiplier, coastal head,
                canal stages, well pumping, hydraulic conductivity, fixed-head masks, and active-cell
                geometry. Outputs are gridded head, estimated interface depth, scenario-baseline
                differences, and derived well risk metrics.
              </p>
              <a class="button button-secondary" href="/map">Inspect live map</a>
            </div>

            <div class="product-console" aria-label="Halocline product console preview">
              <aside class="console-rail" aria-label="Scenario controls">
                <span class="console-label">Scenario inputs</span>
                <div class="control-stack">
                  <div class="control-row">
                    <span>Preset</span>
                    <strong>Low recharge + high coastal head</strong>
                  </div>
                  <div class="control-row">
                    <span>Recharge</span>
                    <strong>0.82x</strong>
                  </div>
                  <div class="control-row">
                    <span>Sea level</span>
                    <strong>+0.38 m</strong>
                  </div>
                  <div class="control-row">
                    <span>Wellfield</span>
                    <strong>Central Dade</strong>
                  </div>
                  <div class="control-row">
                    <span>Canal stage</span>
                    <strong>0.55 m</strong>
                  </div>
                </div>
              </aside>

              <div class="scenario-map-panel scientific-image-frame" aria-label="Pending scenario surface image">
                <div class="map-title">
                  <strong>Biscayne / Miami-Dade</strong>
                  <span>scenario inputs and output grids</span>
                </div>
                <div class="scientific-image">
                  <img
                    src="/assets/scenario_surface.png"
                    alt="Scenario surface graphic showing scalar inputs, spatial fields, head output, interface-depth output, and well-risk markers."
                    width="987"
                    height="980"
                  />
                </div>
              </div>

              <aside class="evidence-rail" aria-label="Scenario evidence">
                <span class="console-label">Run evidence</span>
                <div class="evidence-card">
                  <strong>Well-risk metric</strong>
                  <span>Risk ratio is derived from pumping and critical pumping, not observed chloride.</span>
                </div>
                <div class="evidence-card">
                  <strong>Grid outputs</strong>
                  <span><span class="evidence-number">2</span> primary rasters: head and interface depth.</span>
                </div>
                <div class="evidence-card">
                  <strong>Diagnostics attached</strong>
                  <span>Convergence, mass-balance residual, warning severity, and assumption notes.</span>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section class="section section-light" id="evidence" aria-labelledby="evidence-title">
          <div class="section-inner">
            <div class="section-heading">
              <div>
                <p class="label">Evidence posture</p>
                <h2 id="evidence-title">Model outputs are interpretable because assumptions remain visible</h2>
              </div>
              <p>
                The interface keeps source provenance, numerical diagnostics, warning conditions,
                and non-regulatory model status adjacent to the modeled outputs.
              </p>
            </div>

            <div class="evidence-grid">
              <article class="evidence-item">
                <h3>Source attribution</h3>
                <p>Reference layers identify agency source, access path, transformation, and Stage 1 limitations.</p>
                <div class="evidence-meta">
                  <span>USGS isochlors <strong>2018 / 2022</strong></span>
                  <span>SFWMD canals <strong>reference</strong></span>
                </div>
              </article>
              <article class="evidence-item">
                <h3>Assumption readouts</h3>
                <p>Controls expose recharge, pumping, canal stage, coastal head, and tuning values instead of hiding them behind a score.</p>
                <div class="evidence-meta">
                  <span>base recharge <strong>visible</strong></span>
                  <span>K scale <strong>visible</strong></span>
                </div>
              </article>
              <article class="evidence-item">
                <h3>Uncertainty language</h3>
                <p>Warnings and diagnostics distinguish model guardrails from observed field conditions and future calibration work.</p>
                <div class="evidence-meta">
                  <span>model status <strong>Stage 1</strong></span>
                  <span>regulatory use <strong>not claimed</strong></span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section class="section" id="research" aria-labelledby="research-title">
          <div class="section-inner">
            <div class="section-heading">
              <div>
                <p class="label">Why the research track exists</p>
                <h2 id="research-title">Coastal-aquifer calibration requires more model evaluations than manual scenario testing can support</h2>
              </div>
              <p>
                Stage 1 keeps the calculation chain inspectable, but operational groundwater
                management eventually requires repeated high-fidelity calibration and uncertainty
                runs. The research track uses surrogate models to screen candidate scenarios before
                committing compute time to MODFLOW, SEAWAT, or PFLOTRAN-class simulators.
              </p>
            </div>

            <div class="research-thesis">
              <article class="research-panel">
                <h3>The management problem</h3>
                <p>
                  MODFLOW-family, SEAWAT, SUTRA, and PFLOTRAN-style workflows can represent
                  subsurface physics more completely, but calibration, uncertainty quantification, and
                  operational scenario sweeps require many repeated forward runs. Surrogates are useful
                  only if they reduce that search space while preserving enough spatial structure to
                  select the correct high-fidelity runs.
                </p>
              </article>

              <div class="research-kpis" aria-label="Research motivation metrics">
                <div class="research-kpi">
                  <span>GeoFUSE benchmark</span>
                  <strong>360,000x</strong>
                  <em>reported speedup from PFLOTRAN-scale runs to U-FNO inference</em>
                </div>
                <div class="research-kpi">
                  <span>GeoFUSE training base</span>
                  <strong>1,500</strong>
                  <em>geological realizations used for U-FNO training</em>
                </div>
                <div class="research-kpi">
                  <span>Our current test</span>
                  <strong>4k / 500 / 500</strong>
                  <em>synthetic oracle train, validation, and held-out test split</em>
                </div>
                <div class="research-kpi">
                  <span>Target operating model</span>
                  <strong>days</strong>
                  <em>use surrogates to identify the right expensive runs, not replace validation</em>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="section section-ink" id="papers" aria-labelledby="papers-title">
          <div class="section-inner">
            <div class="section-heading">
              <div>
                <p class="label">Research lineage</p>
                <h2 id="papers-title">GeoFUSE establishes the surrogate-model precedent for seawater intrusion</h2>
              </div>
              <p>
                GeoFUSE pairs PFLOTRAN-generated seawater-intrusion simulations with U-FNO
                inference, PCA parameterization, and ESMDA data assimilation. Halocline uses that
                result as the research baseline while testing whether WNO and GNN methods can
                better preserve spatial heterogeneity.
              </p>
            </div>

            <div class="paper-grid" aria-label="Key research papers">
              <article class="paper-card">
                <h3>GeoFUSE</h3>
                <p>
                  Jiang, Liu, and Dwivedi integrate U-FNO, PCA, and ESMDA for seawater intrusion
                  prediction and uncertainty reduction on a Beaver Creek cross-section.
                </p>
                <a href="https://arxiv.org/abs/2410.20118" target="_blank" rel="noreferrer">arXiv 2410.20118</a>
              </article>
              <article class="paper-card">
                <h3>U-FNO / FNO</h3>
                <p>
                  The Fourier neural operator lineage supplies the fast operator approximation. GeoFUSE
                  uses U-FNO, based on Wen et al. and Li et al., to estimate pressure and salinity fields.
                </p>
                <a href="https://doi.org/10.1016/j.advwatres.2022.104180" target="_blank" rel="noreferrer">Wen et al. 2022</a>
              </article>
              <article class="paper-card">
                <h3>WNO / GNN path</h3>
                <p>
                  WNO brings localized multiresolution operators; graph-network surrogates bring
                  mesh and connectivity awareness for wells, canals, faults, and irregular geology.
                </p>
                <a href="https://doi.org/10.1016/j.cma.2022.115783" target="_blank" rel="noreferrer">WNO reference</a>
              </article>
            </div>

            <div class="reference-list" aria-label="GeoFUSE reference family">
              <span>Werner et al. 2013 seawater intrusion review</span>
              <span>Ketabchi et al. 2016 sea-level-rise review</span>
              <span>Langevin and Guo 2006; SEAWAT 2008</span>
              <span>Provost and Voss 2019 SUTRA</span>
              <span>Hammond et al. 2014 PFLOTRAN</span>
              <span>Yabusaki et al. 2020 Beaver Creek</span>
              <span>Emerick and Reynolds 2013 ESMDA</span>
              <span>Arora et al. 2011 / 2012 inverse estimation</span>
              <span>Bhattacharjya and Datta 2009 ANN-GA</span>
              <span>Sreekanth and Datta 2010 surrogate management</span>
              <span>Hussain et al. 2015 simulation optimization</span>
              <span>Rajabi and Ketabchi 2017 Gaussian emulation</span>
              <span>Mo et al. 2019 deep autoregressive groundwater</span>
              <span>Tang et al. 2020 dynamic subsurface surrogate</span>
              <span>Li et al. 2020 Fourier neural operator</span>
              <span>Wen et al. 2022 U-FNO multiphase flow</span>
              <span>Meray et al. 2024 groundwater contamination surrogate</span>
              <span>Cao et al. 2024 coastal-aquifer data assimilation</span>
              <span>Han et al. 2024 CO2 storage surrogate</span>
              <span>Jiang and Durlofsky 2023 multifidelity surrogates</span>
              <span>Jiang and Durlofsky 2024 data-space inversion</span>
              <span>Goebel et al. 2017 resistivity intrusion imaging</span>
              <span>Dodangeh et al. 2022 joint coastal aquifer inversion</span>
              <span>Yoon et al. 2017 saline aquifer pressure data</span>
              <span>Zhou et al. 2022 simultaneous property inference</span>
              <span>Zhou and Tartakovsky 2021 NN-surrogate MCMC</span>
              <span>Sonnenborg et al. 2015 geology uncertainty</span>
              <span>He et al. 2015 hydrological predictive uncertainty</span>
              <span>Ebong et al. 2020 stochastic petrophysical modeling</span>
              <span>Messier et al. 2015 groundwater radon estimation</span>
              <span>Remy et al. 2009 SGeMS geostatistics</span>
              <span>Siler et al. 2019 3D geothermal geology</span>
              <span>Torresan et al. 2020 3D hydrogeology</span>
              <span>Strati et al. 2017 integrated 3D crust model</span>
              <span>Dwivedi et al. 2018 riparian hot moments</span>
              <span>Zhong et al. 2019 cDC-GAN plume prediction</span>
              <span>Kingma and Ba 2014 Adam optimizer</span>
            </div>
          </div>
        </section>

        <section class="section section-light" id="study" aria-labelledby="study-title">
          <div class="section-inner">
            <div class="section-heading">
              <div>
                <p class="label">Current Halocline study</p>
                <h2 id="study-title">The current U-FNO experiment is trained on synthetic physics-oracle data</h2>
              </div>
              <p>
                This was a compute and workflow test, not a MODFLOW/SEAWAT replacement and
                not a field-validated aquifer model. We rented GPU compute, generated synthetic
                oracle data from the Python Stage 1 solver, trained a U-FNO-style surrogate, and
                measured held-out error and inference speed.
              </p>
            </div>

            <div class="study-grid">
              <div>
                <article class="study-card">
                  <h3>Generated data</h3>
                  <p>
                    Latin Hypercube samples varied recharge, sea-level rise, three placeholder well
                    pumpings, eleven canal stages, and five calibration-lite tuning controls. Each sample
                    was solved by the Python oracle and stored as HDF5.
                  </p>
                  <div class="data-schema" aria-label="U-FNO generated data schema">
                    <div class="schema-row"><span>Split</span><strong>4,000 train / 500 val / 500 test</strong></div>
                    <div class="schema-row"><span>Grid</span><strong>37 x 21 active-mask domain</strong></div>
                    <div class="schema-row"><span>Grid inputs</span><strong>mask, x, y, K, recharge, pumping, fixed head, fixed-head mask</strong></div>
                    <div class="schema-row"><span>Extra inputs</span><strong>7 scalar controls + well pumping + canal stages</strong></div>
                    <div class="schema-row"><span>Targets</span><strong>head grid + interface-depth grid</strong></div>
                  </div>
                </article>
                <article class="study-card">
                  <h3>Careful framing</h3>
                  <p>
                    Accuracy is measured against a simplified synthetic oracle, not observations. The
                    oracle is a 2D steady sharp-interface model, not a calibrated MODFLOW, SEAWAT, or
                    PFLOTRAN model. The surrogate accelerates this simplified oracle; it does not
                    replace high-fidelity numerical simulation or site calibration.
                  </p>
                </article>
              </div>

              <div class="chart-panel" aria-label="U-FNO benchmark charts">
                <div class="chart-title">
                  <strong>U-FNO prediction vs synthetic physics oracle</strong>
                  <span>held-out test set</span>
                </div>
                <div class="scientific-image ufno-placeholder">
                  <img
                    src="/assets/ufno_heatmap.png"
                    alt="U-FNO held-out comparison heatmap showing synthetic physics oracle, surrogate prediction, and absolute error."
                    width="1448"
                    height="1086"
                  />
                </div>
                <p class="image-caption">
                  U-FNO prediction vs synthetic physics oracle (held-out test set). Summary metrics:
                  head MAE 1.78 m, interface-depth MAE 8.02 m, batch-2048 inference speedup 174.57x
                  versus the Python oracle.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="section" id="roadmap" aria-labelledby="roadmap-title">
          <div class="section-inner">
            <div class="section-heading">
              <div>
                <p class="label">Research direction</p>
                <h2 id="roadmap-title">Use surrogate speed where it helps, then spend simulator time where it matters</h2>
              </div>
              <p>
                The next step is to test surrogate architectures that preserve spatial structure
                in high- and low-variance geologic zones,
                then use that speed to choose better MODFLOW, SEAWAT, or PFLOTRAN calibration runs.
              </p>
            </div>

            <div class="roadmap-grid">
              <article class="roadmap-card">
                <span class="roadmap-index">01 / WNO</span>
                <h3>Local frequency fit</h3>
                <p>
                  Wavelet neural operators are attractive because wavelets can localize information
                  across space and scale. That is the right failure mode to test when Fourier-style
                  surrogates risk blurring sharp salinity fronts or high-variance hydraulic properties.
                </p>
              </article>
              <article class="roadmap-card">
                <span class="roadmap-index">02 / GNN</span>
                <h3>Geometry and connectivity</h3>
                <p>
                  Graph surrogates can represent irregular cells, wells, canal links, boundaries, and
                  local neighborhoods more naturally than a rectangular image alone. That matters as
                  Halocline moves from Stage 1 grids toward utility and consultant model domains.
                </p>
              </article>
              <article class="roadmap-card">
                <span class="roadmap-index">03 / Simulator triage</span>
                <h3>Run the expensive model on the right cases</h3>
                <p>
                  The practical target is a workflow where surrogate sweeps narrow thousands of
                  candidates to the small set of scenarios and calibration runs that deserve full
                  simulator time, shortening delivery from open-ended compute cycles to days or a week.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section class="section section-ink cta-band" aria-labelledby="cta-title">
          <div class="section-inner cta-grid">
            <div class="cta-copy">
              <p class="label">Working draft</p>
              <h2 id="cta-title">Inspect the Stage 1 model and the surrogate-research path</h2>
              <p>
                The current product exposes the Stage 1 scenario calculation chain. The research
                track evaluates whether surrogate models can reduce the number of expensive
                simulator runs required for calibration and uncertainty analysis.
              </p>
            </div>
            <div class="cta-actions">
              <a class="button button-primary" href="/map">Open map</a>
              <a class="button button-secondary" href="/checkpoint">Open checkpoint</a>
            </div>
          </div>
        </section>
      </main>

      <footer class="footer">
        <div class="footer-inner">
          <span class="footer-brand">
            <img src="/assets/halocline-mark.png" alt="" width="768" height="804" aria-hidden="true" />
            Halocline
          </span>
          <span>Scenario-driven coastal-aquifer modeling. Stage 1 is provisional and non-regulatory.</span>
        </div>
      </footer>
    </div>
  </body>
</html>`;
