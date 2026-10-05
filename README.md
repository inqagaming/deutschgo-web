# deutschgo-web
## Tests

Browser tests for the site, with [Playwright](https://playwright.dev).

```bash
npm ci
npx playwright install chromium
npm test            # headless
npm run test:ui     # the UI runner — best place to learn what the tests do
```

`serve.py` stands in for GitHub Pages while the tests run: it resolves
`/blog/foo` to `blog/foo.html`, which Python's own `http.server` will not.
Playwright starts and stops it, so there is nothing to run by hand.

What is covered, and why each one is there:

| File | Guards |
|---|---|
| `consent.spec.js` | No tracker loads before consent — watched on the network, not in the DOM |
| `language.spec.js` | TR/EN swap, and that every English screenshot actually loads rather than silently falling back to Turkish |
| `navigation.spec.js` | Every internal link resolves; the blog can always reach the current landing page |
| `content.spec.js` | The counts on the page still match what the app ships |

`content.spec.js` holds the numbers the app derives at runtime from
`ContentStats`. When a content release moves them, these fail until the page is
updated — which is the point.
