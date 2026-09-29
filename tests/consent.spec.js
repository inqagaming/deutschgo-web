const { test, expect } = require('@playwright/test');

/**
 * The promise the banner makes is not "we showed a banner" — it is that
 * nothing setting a cookie runs until the visitor says yes. That is a claim
 * about network traffic, so these tests watch the network rather than the DOM.
 */

const TRACKERS = /googletagmanager\.com|google-analytics\.com|appsflyersdk\.com/;

/** Every tracker request the page makes, from the moment it is called. */
function watchTrackers(page) {
  const seen = [];
  page.on('request', (r) => {
    if (TRACKERS.test(r.url())) seen.push(r.url());
  });
  return seen;
}

test.describe('cookie consent', () => {
  test('loads no tracker before the visitor agrees', async ({ page }) => {
    const seen = watchTrackers(page);
    await page.goto('/');

    await expect(page.locator('section.dg-consent')).toBeVisible();
    // Proving a negative needs a window to be wrong in: the trackers load
    // asynchronously, so an immediate assertion would pass even if broken.
    await page.waitForTimeout(1500);

    expect(seen, 'a tracker loaded before consent').toEqual([]);
  });

  test('accepting loads them and is remembered', async ({ page }) => {
    await page.goto('/');
    // Start waiting BEFORE the click: the request can be in flight before the
    // next line runs, and then the wait would sit there until it timed out.
    const tracker = page.waitForRequest(TRACKERS, { timeout: 15_000 });
    await page.locator('button.dg-accept').click();

    await expect(page.locator('section.dg-consent')).toBeHidden();
    await tracker;

    await page.reload();
    await expect(page.locator('section.dg-consent')).toBeHidden();
  });

  test('rejecting keeps them out, through a reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.dg-reject').click();
    await expect(page.locator('section.dg-consent')).toBeHidden();

    const seen = watchTrackers(page);
    await page.reload();
    await page.waitForTimeout(1500);

    expect(seen, 'a tracker loaded after the visitor said no').toEqual([]);
  });

  test('the choice can be reopened and changed', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.dg-reject').click();
    await expect(page.locator('section.dg-consent')).toBeHidden();

    // "Cookie settings" in the footer. Withdrawing has to be as easy as giving.
    await page.locator('[data-consent-open]').first().click();
    await expect(page.locator('section.dg-consent')).toBeVisible();
  });
});
