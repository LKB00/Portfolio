# Portfolio

Lokesh Bhatia — product design portfolio.

## Upload these files to the REPO ROOT

Not inside a folder. `index.html` must sit next to this README, or GitHub Pages will not find it.

```
index.html
about.html
app-merge.html
rise-portal.html
core-design-system.html
FixedAndVariable.dc.html
support.js
image-slot.js
.nojekyll
assets/            (21 files — keep the folder)
```

If a `Portfolio/` folder already exists in the repo from an earlier upload, delete it — it holds redirect stubs that point at a file which does not exist.

## Hosting on GitHub Pages

Settings → Pages → Source: `main`, folder `/ (root)`.

The repo must be public, or Pages needs a paid plan.

## Notes

- `support.js` is required — without it every page loads blank.
- `image-slot.js` renders the image placeholders.
- `FixedAndVariable.dc.html` is loaded by the app-merge page; keep the filename exactly as-is.
- `assets/` holds every image. Keep the folder name and its contents together.
- `.nojekyll` stops GitHub stripping files; it is invisible in Finder — enable hidden files (⌘⇧.) when dragging, or create it on GitHub with "Add file → Create new file" named `.nojekyll`.
- Add `resume.pdf` at the root — the nav and command palette link to it, and it is not included here.
