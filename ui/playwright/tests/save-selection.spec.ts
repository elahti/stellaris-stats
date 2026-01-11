import { test, expect } from '../fixtures/test-base'

test.describe('Save Selection', () => {
  test('shows welcome state on initial load', async ({
    page,
    resetDatabase,
  }) => {
    await resetDatabase()
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'Stellaris Stats' }),
    ).toBeVisible()
    await expect(page.getByText('Select a save from the sidebar')).toBeVisible()
  })

  test('displays list of saves in sidebar', async ({ page, loadFixture }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await expect(page.getByRole('heading', { name: 'Saves' })).toBeVisible()
    await expect(
      sidebar.getByRole('heading', { name: 'Empire Alpha' }),
    ).toBeVisible()
    await expect(
      sidebar.getByRole('heading', { name: 'Empire Beta' }),
    ).toBeVisible()
    await expect(
      sidebar.getByRole('heading', { name: 'Empire Gamma' }),
    ).toBeVisible()
  })

  test('selecting a save shows the dashboard', async ({
    page,
    loadFixture,
  }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await sidebar.getByRole('heading', { name: 'Empire Alpha' }).click()

    await expect(
      page.getByRole('heading', { name: 'Empire Budget' }),
    ).toBeVisible()
    await expect(page.getByRole('main').getByText('Empire Alpha')).toBeVisible()
  })

  test('dashboard displays resource category sections', async ({
    page,
    loadFixture,
  }) => {
    await loadFixture('single-save-with-budget.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await sidebar.getByRole('heading', { name: 'Test Empire' }).click()

    // Core categories that should always be present with test data
    await expect(
      page.getByRole('heading', { name: 'Basic Resources' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Advanced Resources' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Abstract Resources' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Research' })).toBeVisible()

    // Strategic categories (present because fixture has this data)
    await expect(
      page.getByRole('heading', { name: 'Basic Strategic Resources' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Advanced Strategic Resources' }),
    ).toBeVisible()
  })

  test('chart legends show resource names and values', async ({
    page,
    loadFixture,
  }) => {
    await loadFixture('single-save-with-budget.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await sidebar.getByRole('heading', { name: 'Test Empire' }).click()

    // Basic resources legend shows names
    await expect(page.getByText('Energy').first()).toBeVisible()
    await expect(page.getByText('Minerals').first()).toBeVisible()
    await expect(page.getByText('Food').first()).toBeVisible()
    await expect(page.getByText('Trade').first()).toBeVisible()

    // Legend shows values (latest values from fixture)
    await expect(page.getByText('+350').first()).toBeVisible() // Energy
  })

  test('empty categories are not rendered', async ({ page, loadFixture }) => {
    // Use multiple-saves fixture which has no budget data
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await sidebar.getByRole('heading', { name: 'Empire Alpha' }).click()

    // Should show no data message instead of chart sections
    await expect(page.getByText('No budget data available')).toBeVisible()

    // Chart sections should not be visible
    await expect(
      page.getByRole('heading', { name: 'Basic Resources' }),
    ).not.toBeVisible()
  })
})
