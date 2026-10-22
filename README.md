# kitchen website

Landing page for Kitchen: open-source software as real apps on your own laptop.
Built from the *Kitchen – Brand and Website Brief* (v3, Oct 2026), kept in [`brief/`](brief/).

Static [Astro](https://astro.build) site. No framework runtime ships to the browser,
only two small scripts (the binary art renderer and the toggles).

## Run it

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static files in dist/
npm run preview
```

Needs Node 22.23.4 or newer (see `.nvmrc`).

## Deploy

**Netlify (ready):** the `X-Robots-Tag: noindex` header in `netlify.toml` keeps this demo out of search until it becomes the real site. connect the repo in Netlify. `netlify.toml` sets the build
command, publish folder, Node version and cache headers. The waitlist form uses
Netlify Forms, so signups show up under *Forms* in the Netlify dashboard and export
to CSV.

**Anywhere else:** it's a static site. Upload `dist/` to any static host. If you
later need server routes on Netlify, run `npx astro add netlify`.

## Changing the words

All copy lives in [`src/content/site.ts`](src/content/site.ts). Every block has a
`story` version (default) and a `tech` version (shown when the visitor flips the
story/tech toggle). Edit the text there; layout code doesn't need to change.

Placeholders to fill in, all in `site.ts`:

| What | Where |
|---|---|
| Book a demo link | `links.bookDemo` |
| Waitlist tool | `waitlist.action` (empty = Netlify Forms) |
| Social links | `links.socials` |
| Menu apps (example apps for now) | `menu.items` |
| Receipt numbers | `houseRules.receipt` |

Analytics: `window.track(name, props)` fires `waitlist_signup`, `demo_click`,
`theme_toggle` and `mode_toggle`. It forwards to Plausible or a `dataLayer` once
either script is added to `src/layouts/Base.astro`.

## Binary art

Every main visual is a food or kitchen image drawn in flickering 0s and 1s.

```
art-src/*.png  --scripts/prepare-art.py-->  public/art/*.json  --<BinaryArt>-->  <canvas>
```

- `scripts/draw-sources.py` draws the current flat source images (placeholders we
  own). Swap any `art-src/*.png` for a real photo or illustration: one clear subject,
  plain background, strong silhouette.
- `scripts/prepare-art.py` removes the background, crops, boosts contrast, snaps to
  the brand palette, runs Sobel edge detection and writes a compact grid. Needs
  Python 3 with Pillow. Run `npm run art` (or `python3 scripts/prepare-art.py mug`
  for one piece).
- `src/components/BinaryArt.astro` + `src/scripts/binary-art.ts` render it on canvas
  with a glyph atlas: idle flicker, load-in from scattered digits, hover push, and
  rising steam on the hero mug. Colors come from CSS tokens, so the theme switch
  only recolors. Animation pauses off screen and is off for reduced-motion.
- `/art` is a test page with every piece in light and dark side by side.

## Map

```
src/content/site.ts       all copy, links and placeholders
src/styles/global.css     color tokens (light + dark), type, shared styles
src/components/           one component per section, plus Landscape and BinaryArt
src/scripts/ui.ts         theme + story/tech toggles, nav, status chip, waitlist form
src/pages/index.astro     the page, 404.astro, art.astro (test page)
```
