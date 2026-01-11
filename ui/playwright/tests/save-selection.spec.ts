import { test, expect } from '../fixtures/test-base'

test.describe('Save Selection', () => {
  test('shows welcome state on initial load', async ({ page, resetDatabase }) => {
    await resetDatabase()
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Stellaris Stats' })).toBeVisible()
    await expect(page.getByText('Select a save from the sidebar')).toBeVisible()
  })

  test('displays list of saves in sidebar', async ({ page, loadFixture }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await expect(page.getByRole('heading', { name: 'Saves' })).toBeVisible()
    await expect(sidebar.getByRole('heading', { name: 'Empire Alpha' })).toBeVisible()
    await expect(sidebar.getByRole('heading', { name: 'Empire Beta' })).toBeVisible()
    await expect(sidebar.getByRole('heading', { name: 'Empire Gamma' })).toBeVisible()
  })

  test('selecting a save shows the dashboard', async ({ page, loadFixture }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await sidebar.getByRole('heading', { name: 'Empire Alpha' }).click()

    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()
    await expect(page.getByRole('main').getByText('Empire Alpha')).toBeVisible()
  })

  test('dashboard displays chart sections', async ({ page, loadFixture }) => {
    await loadFixture('single-save-with-budget.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await sidebar.getByRole('heading', { name: 'Test Empire' }).click()

    await expect(page.getByRole('heading', { name: 'Primary Resources' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Secondary Resources' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Advanced Resources' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'All Resources' })).toBeVisible()
  })

  test('chart legends show resource names', async ({ page, loadFixture }) => {
    await loadFixture('single-save-with-budget.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await sidebar.getByRole('heading', { name: 'Test Empire' }).click()

    // Primary resources legend (use first() since labels appear in multiple charts)
    await expect(page.getByText('Energy').first()).toBeVisible()
    await expect(page.getByText('Minerals').first()).toBeVisible()
    await expect(page.getByText('Food').first()).toBeVisible()
  })
})
