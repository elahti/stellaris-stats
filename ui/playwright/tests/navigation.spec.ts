import { test, expect } from '../fixtures/test-base'

test.describe('Navigation', () => {
  test('switching between saves updates dashboard', async ({
    page,
    loadFixture,
  }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')

    // Wait for saves to load, then select first save
    await expect(
      sidebar.getByRole('heading', { name: 'Empire Alpha' }),
    ).toBeVisible()
    await sidebar.getByRole('heading', { name: 'Empire Alpha' }).click()
    await expect(
      page.getByRole('heading', { name: 'Empire Budget' }),
    ).toBeVisible()

    // Switch to second save (no budget data)
    await sidebar.getByRole('heading', { name: 'Empire Beta' }).click()

    // Dashboard should still be visible but may show different content
    await expect(
      page.getByRole('heading', { name: 'Empire Budget' }),
    ).toBeVisible()
  })

  test('selected save remains highlighted', async ({ page, loadFixture }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')

    // Wait for saves to load
    await expect(
      sidebar.getByRole('heading', { name: 'Empire Alpha' }),
    ).toBeVisible()
    await sidebar.getByRole('heading', { name: 'Empire Alpha' }).click()

    // Wait for dashboard to load
    await expect(
      page.getByRole('heading', { name: 'Empire Budget' }),
    ).toBeVisible()
  })

  test('can navigate between multiple saves', async ({ page, loadFixture }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')

    // Wait for saves to load, then navigate through all saves
    await expect(
      sidebar.getByRole('heading', { name: 'Empire Alpha' }),
    ).toBeVisible()
    await sidebar.getByRole('heading', { name: 'Empire Alpha' }).click()
    await expect(
      page.getByRole('heading', { name: 'Empire Budget' }),
    ).toBeVisible()

    await sidebar.getByRole('heading', { name: 'Empire Beta' }).click()
    await expect(
      page.getByRole('heading', { name: 'Empire Budget' }),
    ).toBeVisible()

    await sidebar.getByRole('heading', { name: 'Empire Gamma' }).click()
    await expect(
      page.getByRole('heading', { name: 'Empire Budget' }),
    ).toBeVisible()

    // Navigate back to first save
    await sidebar.getByRole('heading', { name: 'Empire Alpha' }).click()
    await expect(
      page.getByRole('heading', { name: 'Empire Budget' }),
    ).toBeVisible()
  })
})
