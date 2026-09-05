# Portfolio

Lokesh Bhatia — product design portfolio.

## Layout

The site serves from the **repo root**. `index.html` sits next to this README.
There is no `Portfolio/` subfolder and there should not be one.

## Deployment

Vercel, with the project's **Root Directory left empty**. Pushing to `main`
deploys.

## Do not delete

- `resume.pdf`
- `favicon.ico`, `favicon-96.png`, `apple-touch-icon.png`, `icon-192.png`,
  `icon-512.png`
- `site.webmanifest`
- `.nojekyll`
- `api/stats.js`

The current pages do not reference these — they use `assets/lokesh-face.png`
as the favicon and link to `resume.html` rather than the PDF. They are kept
deliberately: the PDF is a stable public URL that may be linked from outside
the site, and the icons cover browsers and devices that look for them by
convention at the root. Do not remove them on the grounds that nothing links
to them.

## Assets

`assets/` holds every image the site uses. Keep the folder name and its
contents together; all pages reference it as `./assets/…`.

## Analytics

Each page carries the Umami tag inline in its `<head>`, alongside
`analytics.js`. `.github/workflows/inject-analytics.yml` adds that tag to any
root-level page missing it; it skips `assets/` so the embedded animation
files are never tagged.
