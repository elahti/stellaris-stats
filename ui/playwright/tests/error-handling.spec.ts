import { test, expect } from '../fixtures/test-base'

test.describe('Error Handling', () => {
  test('shows empty state when no saves exist', async ({
    page,
    resetDatabase,
  }) => {
    await resetDatabase()
    await page.goto('/')

    // Saves heading should still be visible
    await expect(page.getByRole('heading', { name: 'Saves' })).toBeVisible()

    // Welcome message should be shown since no save is selected
    await expect(page.getByText('Select a save to begin')).toBeVisible()
  })

  test('handles save with no budget data gracefully', async ({
    page,
    loadFixture,
  }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')

    // Empire Beta has no budget data
    await sidebar.getByRole('heading', { name: 'Empire Beta' }).click()

    // Should show the dashboard but with appropriate message
    await expect(
      page.getByRole('heading', { name: 'Empire Budget' }),
    ).toBeVisible()
  })
})
