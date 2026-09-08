# og/ — the link thumbnail

The image that appears when `lokeshbhatia.com` is pasted into WhatsApp,
Slack, LinkedIn, X or iMessage. `card.html` is the source; `build.sh`
renders it to `../og-image-v2.png`, which is what the `og:image` and
`twitter:image` tags on all six pages point at.

```
./og/build.sh
```

Chrome headless at 2x, downsampled to exactly 1200×630.

**Changing it.** Edit `card.html`, run `build.sh`, and update the
`og:image:alt` text on all six pages to match — the alt is a description
of the picture, so it goes stale the moment the picture changes.

**Changing the tone.** `<body class="dark">` for the dark card,
`<body class="">` for the light one. Both are in `card.css`.

**If the filename changes.** X, LinkedIn and Slack cache a thumbnail
against its URL and are slow to look again. Publishing under a new
filename (`-v2`, `-v3`) is the only reliable way to force a re-fetch, so
the old file stays where it is rather than being overwritten.
