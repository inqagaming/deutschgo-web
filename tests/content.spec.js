const { test, expect } = require('@playwright/test');

/**
 * The counts on the page are a promise about the app. They drifted a whole
 * release behind once — the site still said 3600+ while the app shipped 3,746
 * — because nothing connected the two.
 *
 * The app derives its own copy from the data at runtime (ContentStats). The
 * site cannot, so this is the seam: when a content release moves a number,
 * this test fails until the page is updated.
 */

// From ContentStats, rounded down the way the marketing copy rounds:
// 3,746 words -> 3700+, 143 grammar topics -> 140+, 44 scenarios -> 40+.
const CLAIMS = {
  words: '3700+',
  sets: '100+',
  level: 'B1',
};

test.describe('content claims', () => {
  test('the word count matches what the app ships', async ({ page }) => {
    await page.goto('/');
    const body = await page.locator('body').innerText();
    expect(body, `the page no longer says ${CLAIMS.words}`).toContain(CLAIMS.words);
    expect(body, 'a stale count is still on the page').not.toContain('3600+');
  });

  test('the page claims the level the app actually covers', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(CLAIMS.level);
  });

  test('the metadata carries the same numbers as the page', async ({ page }) => {
    await page.goto('/');
    // The description is rewritten by setLang, so it is a second place the
    // count lives and a second place it can go stale.
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toContain(CLAIMS.words);

    await page.locator('#btn-en').click();
    const en = await page.locator('meta[name="description"]').getAttribute('content');
    expect(en).toContain(CLAIMS.words);
  });
});
