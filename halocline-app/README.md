# Halocline Map App

Static Vercel frontend for the Halocline surrogate demo. The app packages the RTX 4090 benchmark artifacts and a browser-side scenario view for pitching the physics-oracle-to-surrogate workflow.

This is not a live Python or Torch deployment. Vercel should serve this as a static site, while the measured surrogate results come from `src/data/benchmark.json` and the checked-in visualization PNGs.

## Local Commands

```bash
npm run build
npm run dev
```

`npm run dev` serves `src/` at `http://localhost:4173`.

## Vercel Setup

Create a Vercel project from the GitHub repo and set:

- Root Directory: `halocline-app`
- Build Command: `npm run build`
- Output Directory: `dist`

After the Vercel deployment is live, add `haloclinemap.com` in the Vercel project domains screen. Then update Namecheap DNS to the exact records Vercel gives you for the apex domain and optional `www` subdomain.
