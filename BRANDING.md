# Halocline — Brand System

> A simulation and digital twin platform for coastal aquifer management.
> The brand is built around one physical idea: **the boundary**.

---

## 1. Name

**Halocline** — a one-letter contraction of *halocline*, the boundary layer where salinity changes sharply. This is literally what the product models.

- **Primary:** `Halocline` (brand, product, domains)
- **Scientific reference:** `halocline` (in copy, docs, when precision matters)

**Open question:** If `Halocline.com` / `Halocline.ai` are taken, fall back to `Halocline` (the real term). The brand system below works for either spelling.

---

## 2. Positioning

| | |
|---|---|
| **One-liner** | Interactive simulation for coastal aquifer management. |
| **Category** | Digital twin / simulation (not monitoring, not detection). |
| **Feeling** | Engineering instrument. Geological survey. Quiet authority. |
| **Anti-pattern** | SaaS-blue dashboard. Generic "water tech." Cyan gradients. |

---

## 3. Color palette

Four colors. No gradients. Every color encodes a physical layer of the system.

| Token | Hex | Role | Physical meaning |
|---|---|---|---|
| `ink` | `#0B1E2F` | Primary dark / salt layer | Deep saline groundwater |
| `bone` | `#E8E1D1` | Primary light / aquifer | Limestone, fresh aquifer matrix |
| `steel` | `#445E72` | Secondary / text, UI chrome | Neutral rock, structural |
| `chloride` | `#C47838` | Accent — **use sparingly** | Saltwater intrusion, alerts, signal |

### Usage rules

- **Chloride is signal, not decoration.** Reserve for intrusion indicators, alert states, active/selected map regions. If it shows up everywhere it stops meaning anything.
- **Ink on bone, bone on ink.** These are the two dominant surfaces. Don't mix them at low contrast.
- **No cyan. No teal. No water-blue.** Every competitor is there. We are not.
- **No gradients.** Flat fills only. The geology reference works because it reads as honest.

### Extended (sparingly)

For data visualization where more categories are needed, derive from the core palette:

```
ink-900:     #0B1E2F   (base)
ink-700:     #1E3448
ink-500:     #345066
steel-400:   #6B8296
steel-200:   #A9B8C4
bone-200:    #D4CBB5
bone-100:    #E8E1D1   (base)
bone-50:     #F3EEE0
chloride-600: #9E5E26
chloride-500: #C47838   (base)
chloride-300: #E0A268
```

---

## 4. Typography

Two typefaces. Both free, both Google-hosted, both engineering-credible.

| Use | Typeface | Why |
|---|---|---|
| Display, UI, body | **Inter** | Neutral, precise, excellent at small sizes. Reads as "instrument." |
| Data, readouts, coordinates, well IDs | **IBM Plex Mono** | Engineering provenance, tabular figures, unambiguous glyphs. |

### Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Type scale

| Role | Size | Weight | Font | Notes |
|---|---|---|---|---|
| Display | 48px | 500 | Inter | Wordmark, hero. Letter-spacing: -1.5px |
| H1 | 32px | 500 | Inter | Letter-spacing: -0.5px |
| H2 | 22px | 500 | Inter | |
| H3 | 18px | 500 | Inter | |
| Body | 15px | 400 | Inter | Line-height: 1.6 |
| Small | 13px | 400 | Inter | UI labels, captions |
| Label | 11px | 500 | Inter | Letter-spacing: 1.5–2px, uppercase optional |
| Data | 13px | 400 | IBM Plex Mono | Chloride values, well IDs, coordinates |
| Data (large) | 26px | 500 | IBM Plex Mono | Readout numbers on cards |

**Rule:** Anything that is a number with a unit, a well identifier, or a coordinate → Plex Mono. Everything else → Inter.

---

## 5. Signature motif: the halocline cross-section

This is the visual the brand owns. Use it for:

- Logo / loading state
- Empty states
- Section dividers in docs
- Splash / marketing pages
- Favicon (simplified)

**Structure:**
- Horizontal dashed steel lines above (fresh aquifer layers, decreasing opacity upward)
- Solid ink block below (salt)
- Chloride-colored wedge intruding from one side along the boundary
- Always schematic, never literal

Keep it flat, keep it schematic. It's a diagram, not an illustration.

---

## 6. Tailwind config

Drop into `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B1E2F",
          900: "#0B1E2F",
          700: "#1E3448",
          500: "#345066",
        },
        bone: {
          DEFAULT: "#E8E1D1",
          50:  "#F3EEE0",
          100: "#E8E1D1",
          200: "#D4CBB5",
        },
        steel: {
          DEFAULT: "#445E72",
          200: "#A9B8C4",
          400: "#6B8296",
          600: "#445E72",
        },
        chloride: {
          DEFAULT: "#C47838",
          300: "#E0A268",
          500: "#C47838",
          600: "#9E5E26",
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-1.5px',
        tighter:  '-0.5px',
        label:    '1.5px',
      },
    },
  },
};

export default config;
```

---

## 7. CSS variables (framework-agnostic)

For use in plain CSS, MapLibre style layers, or non-Tailwind contexts:

```css
:root {
  /* Core palette */
  --hal-ink:       #0B1E2F;
  --hal-bone:      #E8E1D1;
  --hal-steel:     #445E72;
  --hal-chloride:  #C47838;

  /* Extended */
  --hal-ink-700:   #1E3448;
  --hal-ink-500:   #345066;
  --hal-steel-400: #6B8296;
  --hal-steel-200: #A9B8C4;
  --hal-bone-200:  #D4CBB5;
  --hal-bone-50:   #F3EEE0;
  --hal-chloride-300: #E0A268;
  --hal-chloride-600: #9E5E26;

  /* Typography */
  --hal-font-sans: 'Inter', system-ui, sans-serif;
  --hal-font-mono: '"IBM Plex Mono"', ui-monospace, monospace;

  /* Surfaces */
  --hal-bg:          var(--hal-bone);
  --hal-bg-raised:   #FFFFFF;
  --hal-text:        var(--hal-ink);
  --hal-text-muted:  var(--hal-steel);
  --hal-border:      rgba(11, 30, 47, 0.12);
  --hal-border-strong: rgba(11, 30, 47, 0.25);
}
```

---

## 8. Map styling (MapLibre)

The map is a core product surface — its palette must match the brand, not default MapTiler.

| Map element | Color |
|---|---|
| Land / background | `bone` (`#E8E1D1`) |
| Water (ocean, bay) | `ink` at 90% (`#0B1E2F`) |
| Roads / admin lines | `steel` at 40% |
| Labels | `ink` for primary, `steel` for secondary |
| USGS well markers | `steel` outline, `bone` fill |
| Active / selected well | `chloride` fill |
| Chloride isochlors (250 mg/L) | `chloride` stroke, 1.5px |
| Intrusion surface / wedge overlay | `chloride` at 35% opacity |
| Scenario delta (increased intrusion) | `chloride` at 50% |
| Scenario delta (improvement) | `steel` at 40% |

Use MapTiler's "Positron" or custom flat style as the base; override with these tokens. Avoid any hillshading, 3D terrain, or satellite imagery in the primary view — it fights the brand.

---

## 9. Do / Don't

**Do**
- Lead with bone surfaces and ink text.
- Use Plex Mono for every number that has a unit.
- Reserve chloride for "something is happening here."
- Keep shapes flat, borders thin (0.5–1px), corners modest (4–8px radius).
- Let whitespace carry the composition.

**Don't**
- Use blue, teal, or cyan anywhere.
- Add gradients, drop shadows, or glow effects.
- Put chloride on large surfaces — it should feel precious.
- Use Inter for data values or Plex Mono for body copy.
- Use emoji in the product UI.
- Title Case headings (sentence case only).

---

## 10. Voice

- **Precise over persuasive.** State the number, cite the source.
- **Physics-first.** "Ghyben-Herzberg," "chloride concentration," "250 mg/L isochlor" — don't dumb it down for engineer buyers.
- **No hype.** Never "revolutionary," "AI-powered," "next-gen." The product speaks through its accuracy, not its adjectives.
- **Honest about uncertainty.** Surrogate models have error bars. Show them.
