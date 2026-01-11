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

    await expect(page.getByRole('heading', { name: 'Saves' })).toBeVisible()
    await expect(page.getByText('Empire Alpha')).toBeVisible()
    await expect(page.getByText('Empire Beta')).toBeVisible()
    await expect(page.getByText('Empire Gamma')).toBeVisible()
  })

  test('selecting a save shows the dashboard', async ({ page, loadFixture }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    await page.getByText('Empire Alpha').click()

    await expect(page.getByRole('heading', { name: 'Empire Budget' })).toBeVisible()
    await expect(page.getByText('Empire Alpha')).toBeVisible()
  })

  test('dashboard displays chart sections', async ({ page, loadFixture }) => {
    await loadFixture('single-save-with-budget.sql')
    await page.goto('/')

    await page.getByText('Test Empire').click()

    await expect(page.getByRole('heading', { name: 'Primary Resources' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Secondary Resources' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Advanced Resources' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'All Resources' })).toBeVisible()
  })

  test('chart legends show resource names', async ({ page, loadFixture }) => {
    await loadFixture('single-save-with-budget.sql')
    await page.goto('/')

    await page.getByText('Test Empire').click()

    // Primary resources legend
    await expect(page.getByText('Energy')).toBeVisible()
    await expect(page.getByText('Minerals')).toBeVisible()
    await expect(page.getByText('Food')).toBeVisible()
  })
})
