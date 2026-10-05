const { test, expect } = require('@playwright/test');

/**
 * The landing page carries both languages in data-tr / data-en attributes and
 * swaps them in place. Which one it opens in is decided by ?lang=, and failing
 * that by the browser's own language — so these pin the language explicitly
 * rather than assuming a default, and there is one test for the detection.
 *
 * The screenshots swap too, and that is the part that has actually broken: the
 * English page once showed the Turkish screens, because img/en/*.webp was
 * missing and the onerror fallback quietly served Turkish. So these assert the
 * image LOADED, not just that its src was rewritten — a missing file passes
 * the src check and fails the visitor.
 */

/** The banner is fixed to the bottom and covers the footer, so clear it. */
async function open(page, url) {
  await page.goto(url);
  await page.locator('button.dg-accept').click();
  await expect(page.locator('section.dg-consent')).toBeHidden();
}

test.describe('language switching', () => {
  test('?lang=tr opens in Turkish', async ({ page }) => {
    await open(page, '/?lang=tr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
    await expect(page.locator('#btn-tr')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('img[data-shot]').first())
      .toHaveAttribute('src', /img\/tr\//);
  });

  test('switching to English swaps the copy, the metadata and the screenshots',
    async ({ page }) => {
      await open(page, '/?lang=tr');
      await page.locator('#btn-en').click();

      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('#btn-en')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#btn-tr')).toHaveAttribute('aria-pressed', 'false');
      await expect(page).toHaveTitle(/German/);
      await expect(page.locator('img[data-shot]').first())
        .toHaveAttribute('src', /img\/en\//);
    });

  test('every English screenshot really exists', async ({ page }) => {
    await open(page, '/?lang=en');

    const shots = page.locator('img[data-shot]');
    const count = await shots.count();
    expect(count, 'no screenshots found to check').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const img = shots.nth(i);
      // They are lazy-loaded: naturalWidth stays 0 until one is on screen.
      await img.scrollIntoViewIfNeeded();
      const src = await img.getAttribute('src');
      expect(src, 'fell back to the Turkish screenshot').toContain('/en/');
      await expect
        .poll(() => img.evaluate((el) => el.naturalWidth),
              { message: `${src} 404s — the page shows a broken image` })
        .toBeGreaterThan(0);
    }
  });

  test('switching back to Turkish restores it', async ({ page }) => {
    await open(page, '/?lang=en');
    await page.locator('#btn-tr').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
    await expect(page.locator('img[data-shot]').first())
      .toHaveAttribute('src', /img\/tr\//);
  });
});

test.describe('language detection', () => {
  test.use({ locale: 'tr-TR' });
  test('a Turkish browser gets Turkish without asking', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  });
});

test.describe('language detection, elsewhere', () => {
  test.use({ locale: 'de-DE' });
  test('any other browser gets English', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
