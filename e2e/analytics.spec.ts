import { test, expect } from '@playwright/test';

/**
 * Smoke: analytics page loads and keeps facts vs interpretation visually distinct.
 * Requires web + API running; skipped in CI unless PLAYWRIGHT_BASE_URL is set.
 */
const base = process.env.PLAYWRIGHT_BASE_URL;

test.describe('analytics transparency', () => {
	test.skip(!base, 'Set PLAYWRIGHT_BASE_URL to run e2e');

	test('shows analytics hero and scoring honesty copy', async ({ page }) => {
		await page.goto(`${base}/analytics`);
		await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
		await expect(page.getByText(/interpretations/i)).toBeVisible();
	});
});
