export const marketingHtml = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Halocline | Coastal aquifer simulation</title>
    <meta
      name="description"
      content="Halocline is an interactive simulation platform for coastal aquifer management."
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
        width: min(100%, var(--max-width));
        margin: 0 auto;
        padding-bottom: 38px;
      }

      .hero-copy-block {
        width: min(100%, 720px);
        margin-bottom: 78px;
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
        font-size: 92px;
        font-weight: 500;
        line-height: 0.92;
      }

      .hero-copy {
        width: min(100%, 610px);
        margin: 0 0 30px;
        color: var(--hal-ink-700);
        font-size: 21px;
        line-height: 1.5;
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
        grid-template-columns: repeat(4, minmax(0, 1fr));
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
        .workflow-frame,
        .model-grid,
        .product-preview,
        .cta-grid {
          grid-template-columns: 1fr;
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
          margin-bottom: 48px;
        }

        h1 {
          font-size: 66px;
        }

        .hero-copy {
          font-size: 19px;
        }

        .hero-readout,
        .trust-grid,
        .workflow-steps,
        .evidence-grid {
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

        .aquifer-diagram,
        .aquifer-diagram svg {
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
            <p class="label">Coastal aquifer simulation</p>
            <h1 id="hero-title">Halocline</h1>
            <p class="hero-copy">
              Interactive simulation for coastal aquifer management, built around the physical boundary
              between fresh groundwater and saline intrusion.
            </p>
            <div class="hero-actions">
              <a class="button button-primary" href="/map">Open scenario map</a>
              <a class="button button-secondary" href="#model">View model approach</a>
            </div>
          </div>

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
              <span class="readout-value">Head, interface, well risk</span>
            </div>
          </div>
        </div>
      </header>

      <section class="trust-strip" aria-label="Trust signals">
        <div class="section-inner trust-grid">
          <div class="trust-item">
            <strong>Physics-first</strong>
            <span>Darcy head solve, Ghyben-Herzberg interface conversion, and well-level upconing risk readouts.</span>
          </div>
          <div class="trust-item">
            <strong>Reference context</strong>
            <span>USGS intrusion lines and SFWMD canal alignments stay visibly separate from modeled output.</span>
          </div>
          <div class="trust-item">
            <strong>Honest limits</strong>
            <span>Stage 1 is a decision-support checkpoint, not a calibrated regulatory model of record.</span>
          </div>
        </div>
      </section>

      <main>
        <section class="section section-light" id="platform" aria-labelledby="platform-title">
          <div class="section-inner">
            <div class="section-heading">
              <div>
                <p class="label">Operational workflow</p>
                <h2 id="platform-title">From scenario input to aquifer consequence</h2>
              </div>
              <p>
                Halocline is designed around an inspectable modeling chain: operators adjust stress,
                the physics pipeline runs, and every boundary movement keeps its assumptions attached.
              </p>
            </div>

            <div class="workflow-frame">
              <aside class="workflow-index-panel" aria-label="Scenario stress summary">
                <strong>Scenario stress profile</strong>
                <p>Example planning run with reduced recharge, sea-level pressure, and a central wellfield pumping increase.</p>
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
                    <strong>stress</strong>
                  </div>
                </div>
              </aside>

              <div class="workflow-steps">
                <article class="workflow-step">
                  <span class="workflow-index">01</span>
                  <h3>Set boundary conditions</h3>
                  <p>Adjust recharge, sea level, canal stage, and wellfield pumping without leaving the map context.</p>
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
                  <h3>Run the model pipeline</h3>
                  <p>Route the scenario through Darcy head, interface-depth conversion, and upconing risk.</p>
                  <span class="step-mark" aria-hidden="true">
                    <svg viewBox="0 0 160 50">
                      <path d="M8 34 C38 12 68 38 96 20 C116 8 134 18 152 10" fill="none" stroke="#0b1e2f" stroke-width="3" />
                      <path d="M8 42 C40 28 68 44 98 30 C122 18 138 28 152 22" fill="none" stroke="#c47838" stroke-width="3" opacity="0.85" />
                    </svg>
                  </span>
                </article>
                <article class="workflow-step">
                  <span class="workflow-index">03</span>
                  <h3>Read the moved boundary</h3>
                  <p>Compare head, interface depth, intrusion change, and well risk against the baseline state.</p>
                  <span class="step-mark" aria-hidden="true">
                    <svg viewBox="0 0 160 50">
                      <path d="M6 30 C46 22 86 28 154 12" fill="none" stroke="#445e72" stroke-width="2" stroke-dasharray="8 8" />
                      <path d="M6 40 C46 35 86 42 154 26" fill="none" stroke="#c47838" stroke-width="4" />
                    </svg>
                  </span>
                </article>
                <article class="workflow-step">
                  <span class="workflow-index">04</span>
                  <h3>Keep the evidence trail</h3>
                  <p>Warnings, provenance, model assumptions, and calculation traces remain next to the answer.</p>
                  <span class="step-mark" aria-hidden="true">
                    <svg viewBox="0 0 160 50">
                      <path d="M16 13 H144 M16 25 H118 M16 37 H138" stroke="#0b1e2f" stroke-width="2" opacity="0.55" />
                      <circle cx="144" cy="13" r="5" fill="#c47838" />
                      <circle cx="118" cy="25" r="5" fill="#445e72" />
                      <circle cx="138" cy="37" r="5" fill="#0b1e2f" />
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
                <h2 id="model-title">The product is the halocline, not a generic water dashboard</h2>
              </div>
              <p>
                The visual system follows the model: limestone aquifer, fixed-head boundaries,
                pumping stress, saline wedge, and a freshwater-saltwater interface that moves when assumptions change.
              </p>
            </div>

            <div class="model-grid">
              <div class="aquifer-diagram" aria-label="Labeled halocline aquifer cross-section">
                <svg viewBox="0 0 760 560" role="img" aria-labelledby="aquifer-title aquifer-desc">
                  <title id="aquifer-title">Halocline aquifer cross-section</title>
                  <desc id="aquifer-desc">A labeled schematic showing recharge, canals, well pumping, sea-level boundary, freshwater head, saltwater interface, chloride wedge, and aquifer-base clamp.</desc>
                  <rect x="0" y="0" width="760" height="560" fill="#f3eee0" />
                  <path d="M0 130 C120 112 224 120 342 101 C472 80 600 76 760 92 L760 560 L0 560 Z" fill="#e8e1d1" />
                  <path d="M0 386 C120 374 220 365 336 354 C480 339 628 320 760 298 L760 560 L0 560 Z" fill="#0b1e2f" />
                  <path d="M330 448 C410 380 500 328 760 260 L760 560 L330 560 Z" fill="#c47838" opacity="0.88" />
                  <path d="M0 386 C120 374 220 365 336 354 C480 339 628 320 760 298" fill="none" stroke="#f3eee0" stroke-width="7" />
                  <path d="M0 382 C120 370 220 361 336 350 C480 335 628 316 760 294" fill="none" stroke="#445e72" stroke-width="2" stroke-dasharray="10 9" />
                  <path d="M20 182 C150 174 264 171 388 155 C520 138 618 128 736 126" fill="none" stroke="#445e72" stroke-width="3" stroke-dasharray="18 12" opacity="0.85" />
                  <path d="M20 240 C156 232 262 238 384 222 C520 204 640 198 736 190" fill="none" stroke="#445e72" stroke-width="3" stroke-dasharray="18 12" opacity="0.64" />
                  <path d="M20 296 C152 288 260 300 382 282 C510 263 642 252 736 248" fill="none" stroke="#445e72" stroke-width="3" stroke-dasharray="18 12" opacity="0.46" />
                  <path d="M0 514 H760" stroke="#445e72" stroke-width="2" stroke-dasharray="8 8" opacity="0.6" />
                  <path d="M108 100 V362" stroke="#0b1e2f" stroke-width="2" />
                  <path d="M96 214 C118 200 142 200 164 214 C142 228 118 228 96 214 Z" fill="none" stroke="#0b1e2f" stroke-width="2" opacity="0.5" />
                  <path d="M480 92 V346" stroke="#0b1e2f" stroke-width="2" />
                  <path d="M440 256 C470 230 494 230 524 256 C494 282 470 282 440 256 Z" fill="none" stroke="#c47838" stroke-width="2" opacity="0.82" />
                  <rect x="640" y="92" width="120" height="468" fill="#0b1e2f" opacity="0.2" />
                  <path d="M638 92 H760" stroke="#0b1e2f" stroke-width="2" />
                  <path d="M48 74 C84 60 120 60 156 74" fill="none" stroke="#445e72" stroke-width="2" />
                  <path d="M76 62 V48 M102 58 V40 M128 62 V48" stroke="#445e72" stroke-width="2" />
                  <path d="M224 95 H322" stroke="#445e72" stroke-width="6" stroke-linecap="round" opacity="0.55" />
                  <path d="M224 116 H322" stroke="#445e72" stroke-width="6" stroke-linecap="round" opacity="0.42" />
                  <path d="M690 70 V126" stroke="#0b1e2f" stroke-width="2" />
                  <path d="M670 126 H730" stroke="#0b1e2f" stroke-width="2" />
                  <text x="42" y="44" class="diagram-label">Recharge</text>
                  <text x="214" y="82" class="diagram-label">Modeled canal cells</text>
                  <text x="422" y="82" class="diagram-label">Pumping well</text>
                  <text x="594" y="74" class="diagram-label">Sea-level boundary</text>
                  <rect x="28" y="158" width="204" height="24" fill="#f3eee0" opacity="0.92" />
                  <text x="38" y="175" class="diagram-note">freshwater head contours</text>
                  <text x="34" y="374" class="diagram-label" fill="#e8e1d1">Fresh aquifer storage</text>
                  <text x="392" y="428" class="diagram-label" fill="#e8e1d1">Saline intrusion wedge</text>
                  <rect x="28" y="516" width="318" height="26" fill="#f3eee0" opacity="0.88" />
                  <text x="38" y="535" class="diagram-note">provisional aquifer-base display clamp</text>
                  <rect x="452" y="266" width="174" height="52" fill="#f3eee0" opacity="0.9" />
                  <text x="466" y="286" class="diagram-note">interface depth</text>
                  <text x="466" y="306" class="diagram-note">screen depth / Qcrit risk</text>
                </svg>
              </div>

              <div class="model-cells">
                <article class="model-cell">
                  <h3>Head solve</h3>
                  <p>2D steady-state Darcy solve over the simplified active grid, with mass-balance diagnostics exposed.</p>
                  <div class="data-row">
                    <span>solver unit</span>
                    <span class="data-value">m / day</span>
                  </div>
                </article>
                <article class="model-cell">
                  <h3>Interface depth</h3>
                  <p>Ghyben-Herzberg conversion turns head into a sharp-interface estimate and reports display clamps.</p>
                  <div class="data-row">
                    <span>readout</span>
                    <span class="data-value">depth m</span>
                  </div>
                </article>
                <article class="model-cell">
                  <h3>Well risk</h3>
                  <p>Upconing stress, Qcrit, and before-after change are summarized per well so the highest-risk wellfield stays visible.</p>
                  <div class="data-row">
                    <span>ranking</span>
                    <span class="data-value">risk ratio</span>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section class="section section-ink" aria-label="Product preview">
          <div class="section-inner product-preview">
            <div class="preview-copy">
              <p class="label">Scenario surface</p>
              <h2>A map-facing instrument panel for coastal groundwater decisions</h2>
              <p>
                The product surface is not just a chart. It combines scenario controls, a geospatial
                model layer, well-priority ranking, warnings, and provenance into one inspectable run.
              </p>
              <a class="button button-secondary" href="/map">Inspect live map</a>
            </div>

            <div class="product-console" aria-label="Halocline product console preview">
              <aside class="console-rail" aria-label="Scenario controls">
                <span class="console-label">Scenario inputs</span>
                <div class="control-stack">
                  <div class="control-row">
                    <span>Preset</span>
                    <strong>Combined stress</strong>
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

              <div class="scenario-map-panel" aria-label="Biscayne scenario map preview">
                <div class="map-title">
                  <strong>Biscayne / Miami-Dade</strong>
                  <span>model head + reference context</span>
                </div>
                <svg viewBox="0 0 560 520" role="img" aria-label="Labeled schematic map with canals, isochlors, wells, and intrusion pressure">
                  <rect width="560" height="520" fill="#e8e1d1" />
                  <path d="M0 65 H560 M0 130 H560 M0 195 H560 M0 260 H560 M0 325 H560 M0 390 H560 M0 455 H560 M70 0 V520 M140 0 V520 M210 0 V520 M280 0 V520 M350 0 V520 M420 0 V520 M490 0 V520" stroke="#445e72" stroke-width="1" opacity="0.16" />
                  <path d="M382 0 C404 56 416 118 410 176 C404 236 424 302 448 356 C468 400 472 462 458 520 L560 520 L560 0 Z" fill="#0b1e2f" />
                  <path d="M320 520 C354 448 394 384 460 346 C498 324 524 302 560 292 L560 520 Z" fill="#c47838" opacity="0.84" />
                  <path d="M48 112 C124 96 202 104 292 76 C338 62 368 55 404 48" fill="none" stroke="#445e72" stroke-width="4" stroke-dasharray="18 12" opacity="0.82" />
                  <path d="M34 178 C126 164 224 178 318 142 C360 126 382 126 416 130" fill="none" stroke="#445e72" stroke-width="4" stroke-dasharray="18 12" opacity="0.66" />
                  <path d="M34 246 C128 232 232 252 334 210 C382 190 412 194 454 210" fill="none" stroke="#445e72" stroke-width="4" stroke-dasharray="18 12" opacity="0.52" />
                  <path d="M84 342 C142 300 202 324 260 286 C308 256 350 262 394 236" fill="none" stroke="#0b1e2f" stroke-width="3" opacity="0.55" />
                  <path d="M92 88 C116 112 154 114 186 100 C224 84 260 92 292 116" fill="none" stroke="#445e72" stroke-width="5" opacity="0.36" />
                  <path d="M102 300 C142 278 180 286 224 304 C260 318 292 310 334 286" fill="none" stroke="#445e72" stroke-width="5" opacity="0.32" />
                  <circle cx="168" cy="184" r="9" fill="#f3eee0" stroke="#0b1e2f" stroke-width="3" />
                  <circle cx="268" cy="268" r="10" fill="#c47838" stroke="#0b1e2f" stroke-width="3" />
                  <circle cx="344" cy="164" r="9" fill="#f3eee0" stroke="#0b1e2f" stroke-width="3" />
                  <path d="M268 268 m-34 0 a34 22 0 1 0 68 0 a34 22 0 1 0 -68 0" fill="none" stroke="#c47838" stroke-width="2" opacity="0.72" />
                </svg>
                <div class="map-legend" aria-label="Map legend">
                  <div class="legend-row">
                    <span class="legend-swatch dashed"></span>
                    <span>USGS isochlor context</span>
                  </div>
                  <div class="legend-row">
                    <span class="legend-swatch"></span>
                    <span>Modeled coastline / canals</span>
                  </div>
                  <div class="legend-row">
                    <span class="legend-swatch chloride"></span>
                    <span>Intrusion pressure</span>
                  </div>
                </div>
              </div>

              <aside class="evidence-rail" aria-label="Scenario evidence">
                <span class="console-label">Run evidence</span>
                <div class="evidence-card">
                  <strong>Highest-risk well</strong>
                  <span>Central Dade placeholder wellfield</span>
                </div>
                <div class="evidence-card">
                  <strong>Wells worsened</strong>
                  <span><span class="evidence-number">3</span> wells changed against baseline</span>
                </div>
                <div class="evidence-card">
                  <strong>Trace attached</strong>
                  <span>Pumping, Qcrit, head change, interface change, and warning severity.</span>
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
                <h2 id="evidence-title">Credible because the limits stay visible</h2>
              </div>
              <p>
                The front end treats trust as part of the interface: provenance, scenario warnings,
                calculation traces, and non-regulatory model status are first-class content.
              </p>
            </div>

            <div class="evidence-grid">
              <article class="evidence-item">
                <h3>Source attribution</h3>
                <p>Reference layers name the agency source, access path, transformation, and Stage 1 limitations.</p>
                <div class="evidence-meta">
                  <span>USGS isochlors <strong>2018 / 2022</strong></span>
                  <span>SFWMD canals <strong>reference</strong></span>
                </div>
              </article>
              <article class="evidence-item">
                <h3>Assumption readouts</h3>
                <p>Controls expose recharge, pumping, canal stage, sea level, and tuning values instead of hiding them behind a score.</p>
                <div class="evidence-meta">
                  <span>base recharge <strong>visible</strong></span>
                  <span>K scale <strong>visible</strong></span>
                </div>
              </article>
              <article class="evidence-item">
                <h3>Uncertainty language</h3>
                <p>Warnings and diagnostics distinguish model guardrails from observed field truth and future calibration work.</p>
                <div class="evidence-meta">
                  <span>model status <strong>Stage 1</strong></span>
                  <span>regulatory use <strong>not claimed</strong></span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section class="section section-ink cta-band" aria-labelledby="cta-title">
          <div class="section-inner cta-grid">
            <div class="cta-copy">
              <p class="label">Working draft</p>
              <h2 id="cta-title">Move from brand promise to the live scenario surface</h2>
              <p>
                The homepage now explains the company through the thing Halocline is building:
                an inspectable coastal aquifer simulation workflow connected to the Stage 1 map.
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
          <span>Interactive simulation for coastal aquifer management. Stage 1 is provisional and non-regulatory.</span>
        </div>
      </footer>
    </div>
  </body>
</html>`;
