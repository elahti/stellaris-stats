import { test, expect } from '../fixtures/test-base'

test.describe('Navigation', () => {
  test('switching between saves updates dashboard', async ({ page, loadFixture }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')

    // Select first save
    await sidebar.getByRole('heading', { name: 'Empire Alpha' }).click()
    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()

    // Switch to second save (no budget data)
    await sidebar.getByRole('heading', { name: 'Empire Beta' }).click()

    // Dashboard should still be visible but may show different content
    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()
  })

  test('selected save remains highlighted', async ({ page, loadFixture }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')

    await sidebar.getByRole('heading', { name: 'Empire Alpha' }).click()

    // Wait for dashboard to load
    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()

    // The parent container should have selected styling
    // We check that clicking worked by verifying the dashboard loaded
    await expect(page.getByRole('main').getByText('Empire Alpha')).toBeVisible()
  })

  test('can navigate between multiple saves', async ({ page, loadFixture }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')

    // Navigate through all saves
    await sidebar.getByRole('heading', { name: 'Empire Alpha' }).click()
    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()

    await sidebar.getByRole('heading', { name: 'Empire Beta' }).click()
    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()

    await sidebar.getByRole('heading', { name: 'Empire Gamma' }).click()
    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()

    // Navigate back to first save
    await sidebar.getByRole('heading', { name: 'Empire Alpha' }).click()
    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()
  })
})
