const { test, expect } = require('@playwright/test');

/**
 * Links are the one thing a static site gets wrong silently. The blog's "Home"
 * link once pointed at the previous version of the site and nobody noticed
 * until somebody clicked it.
 *
 * These walk the real links rather than a list someone has to maintain.
 */

const BASE = 'http://127.0.0.1:4173';

/** The banner is fixed to the bottom and covers footer links. */
async function open(page, url) {
  await page.goto(url);
  await page.locator('button.dg-accept').click();
  await expect(page.locator('section.dg-consent')).toBeHidden();
}

/** Internal hrefs on the current page: absolute, deduplicated, no anchors. */
async function internalLinks(page) {
  const hrefs = await page.locator('a[href]').evaluateAll((els) =>
    els.map((el) => el.getAttribute('href')));
  return [...new Set(hrefs)]
    .filter((h) => h && !h.startsWith('#') && !h.startsWith('mailto:'))
    .filter((h) => !/^[a-z]+:\/\//i.test(h));
}

test.describe('navigation', () => {
  for (const from of ['/', '/blog/']) {
    test(`every internal link on ${from} resolves`, async ({ page, request }) => {
      await open(page, from);
      const links = await internalLinks(page);
      expect(links.length, `no links found on ${from}`).toBeGreaterThan(0);

      const broken = [];
      for (const href of links) {
        const res = await request.get(new URL(href, BASE + from).toString());
        if (!res.ok()) broken.push(`${href} → ${res.status()}`);
      }
      expect(broken, `broken links on ${from}`).toEqual([]);
    });
  }

  test('the blog index lists posts and each one opens', async ({ page }) => {
    await open(page, '/blog/');
    const cards = page.locator('a.post-card');
    const count = await cards.count();
    expect(count, 'the blog index listed no posts').toBeGreaterThan(10);

    // Collect the hrefs first — navigating away invalidates the locator, and
    // re-querying it on the post page finds nothing.
    const hrefs = [];
    for (const i of [0, Math.floor(count / 2), count - 1]) {
      hrefs.push(await cards.nth(i).getAttribute('href'));
    }

    for (const href of hrefs) {
      await page.goto(href);
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  test('the blog links home, keeping the language', async ({ page }) => {
    await open(page, '/blog/?lang=en');

    // The brand logo, not the nav text link: on screens under 700px the CSS
    // hides the last nav link, which is Home. The logo is the way home on a
    // phone, so it is the one route that has to work everywhere.
    await page.locator('a.dg-brand').click();

    // The regression this guards: it went to an older copy of the site, which
    // had no language switcher at all.
    await expect(page.locator('#btn-tr')).toBeVisible();
    await expect(page.locator('#btn-en')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('the nav Home link is desktop only, and the logo covers the phone',
    async ({ page }, testInfo) => {
      await open(page, '/blog/');
      const navHome = page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('link', { name: /Ana sayfa|Home/ });

      const width = page.viewportSize().width;
      // Recorded rather than assumed: blog.css hides .dg-nav-links a:last-child
      // under 700px. If that rule goes, this test says so.
      if (width <= 700) await expect(navHome).toBeHidden();
      else await expect(navHome).toBeVisible();

      // Either way there is always a way home.
      await expect(page.locator('a.dg-brand')).toBeVisible();
    });
});
