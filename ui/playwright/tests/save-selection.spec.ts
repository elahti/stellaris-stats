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

  test('dashboard displays category tabs', async ({ page, loadFixture }) => {
    await loadFixture('single-save-with-budget.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await sidebar.getByRole('heading', { name: 'Test Empire' }).click()

    // Should show category tabs
    await expect(
      page.getByRole('button', { name: 'Basic Resources' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Advanced Resources' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Abstract Resources' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Research' })).toBeVisible()

    // First tab should be active by default, showing its chart
    await expect(
      page.getByRole('heading', { name: 'Basic Resources' }),
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

    // Should show no data message instead of tabs
    await expect(page.getByText('No budget data available')).toBeVisible()

    // Category tabs should not be visible
    await expect(
      page.getByRole('button', { name: 'Basic Resources' }),
    ).not.toBeVisible()
  })

  test('charts do not show uPlot built-in legend', async ({
    page,
    loadFixture,
  }) => {
    await loadFixture('single-save-with-budget.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await sidebar.getByRole('heading', { name: 'Test Empire' }).click()

    // Wait for chart to render
    await expect(
      page.getByRole('heading', { name: 'Basic Resources' }),
    ).toBeVisible()

    // uPlot's built-in legend uses .u-legend class - should not be visible
    await expect(page.locator('.u-legend')).toHaveCount(0)
  })

  test('hovering on chart updates legend values', async ({
    page,
    loadFixture,
  }) => {
    await loadFixture('single-save-with-budget.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await sidebar.getByRole('heading', { name: 'Test Empire' }).click()

    // Wait for chart to render
    await expect(
      page.getByRole('heading', { name: 'Basic Resources' }),
    ).toBeVisible()

    // Get initial Energy value from legend (latest value is +350)
    const energyValue = page.getByText('+350').first()
    await expect(energyValue).toBeVisible()

    // Hover on the chart canvas at an earlier position (left side)
    const canvas = page.locator('canvas').first()
    const box = await canvas.boundingBox()
    if (box) {
      // Use hover with position to trigger uPlot cursor events
      // Position at 10% from left to get first data point
      await canvas.hover({
        position: { x: box.width * 0.1, y: box.height * 0.5 },
        force: true,
      })

      // Wait for the hover state to update and check for changed value
      // The first data point has energy=100, minerals=150, food=50
      await expect(page.getByText('+100').first()).toBeVisible({
        timeout: 2000,
      })
    }
  })

  test('clicking category tab switches displayed chart', async ({
    page,
    loadFixture,
  }) => {
    await loadFixture('single-save-with-budget.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await sidebar.getByRole('heading', { name: 'Test Empire' }).click()

    // Initially shows Basic Resources
    await expect(
      page.getByRole('heading', { name: 'Basic Resources' }),
    ).toBeVisible()
    await expect(page.getByText('Energy')).toBeVisible()

    // Click Research tab
    await page.getByRole('button', { name: 'Research' }).click()

    // Should now show Research chart
    await expect(page.getByRole('heading', { name: 'Research' })).toBeVisible()
    await expect(page.getByText('Physics')).toBeVisible()

    // Basic Resources chart title should no longer be visible
    await expect(
      page.getByRole('heading', { name: 'Basic Resources' }),
    ).not.toBeVisible()
  })

  test('clicking legend item toggles line visibility', async ({
    page,
    loadFixture,
  }) => {
    await loadFixture('single-save-with-budget.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await sidebar.getByRole('heading', { name: 'Test Empire' }).click()

    // Wait for chart to render
    await expect(
      page.getByRole('heading', { name: 'Basic Resources' }),
    ).toBeVisible()

    // Verify all legend items are initially visible
    await expect(page.getByRole('button', { name: /Energy/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Minerals/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Food/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Trade/ })).toBeVisible()

    // Click Energy to hide it from chart
    await page.getByRole('button', { name: /Energy/ }).click()

    // Energy should no longer be in the legend (filtered from chart)
    await expect(page.getByRole('button', { name: /Energy/ })).not.toBeVisible()

    // Other resources should still be visible
    await expect(page.getByRole('button', { name: /Minerals/ })).toBeVisible()
  })
})
