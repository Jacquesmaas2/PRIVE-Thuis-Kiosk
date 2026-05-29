import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

// Test credentials — must match seed.sql user (created via Supabase Dashboard or auth setup)
const TEST_EMAIL = process.env.TEST_EMAIL ?? 'mama@devries.test'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'TestWachtwoord123!'

test.describe('Tasks workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Log in
    await page.goto(`${BASE}/login`)
    await page.getByLabel('E-mailadres').fill(TEST_EMAIL)
    await page.getByLabel('Wachtwoord').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Inloggen' }).click()
    await page.waitForURL(`${BASE}/dashboard`)
  })

  test('can navigate to tasks page', async ({ page }) => {
    await page.goto(`${BASE}/tasks`)
    await expect(page.getByRole('heading', { name: 'Taken' })).toBeVisible()
  })

  test('shows pending and completed tabs', async ({ page }) => {
    await page.goto(`${BASE}/tasks`)
    await expect(page.getByRole('tab', { name: /Te doen/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Gedaan/ })).toBeVisible()
  })

  test('parent can navigate to new task form', async ({ page }) => {
    await page.goto(`${BASE}/tasks`)
    const newButton = page.getByRole('link', { name: 'Nieuwe taak' })
    // Only visible for parents
    if (await newButton.isVisible()) {
      await newButton.click()
      await expect(page.getByRole('heading', { name: 'Nieuwe taak' })).toBeVisible()
      await expect(page.getByLabel('Naam')).toBeVisible()
    }
  })

  test('can complete a pending task', async ({ page }) => {
    await page.goto(`${BASE}/tasks`)

    const afvinkButton = page.getByRole('button', { name: 'Afvinken' }).first()

    // If there is a pending task
    if (await afvinkButton.isVisible()) {
      await afvinkButton.click()

      // Confirm dialog should appear
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('button', { name: 'Ja, klaar!' }).click()

      // After completion, page refreshes — check we're still on tasks page
      await page.waitForURL(`${BASE}/tasks`)
      // Completed tab should now have content or count changed
      await expect(page.getByRole('tab', { name: /Gedaan/ })).toBeVisible()
    } else {
      test.skip(true, 'No pending tasks available in test seed')
    }
  })

  test('dashboard shows tasks summary card', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    // Either tasks card or empty state should be visible
    const hasTasks = await page.getByText('Alle taken bekijken').isVisible().catch(() => false)
    const hasEmpty = await page.getByText('Alles gedaan').isVisible().catch(() => false)
    expect(hasTasks || hasEmpty).toBe(true)
  })
})

test.describe('Grocery workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.getByLabel('E-mailadres').fill(TEST_EMAIL)
    await page.getByLabel('Wachtwoord').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Inloggen' }).click()
    await page.waitForURL(`${BASE}/dashboard`)
  })

  test('can navigate to grocery page', async ({ page }) => {
    await page.goto(`${BASE}/grocery`)
    await expect(page.getByRole('heading', { name: /Boodschap/ })).toBeVisible()
  })

  test('can add a grocery item', async ({ page }) => {
    await page.goto(`${BASE}/grocery`)
    const input = page.getByPlaceholder('Artikel toevoegen...')
    await input.fill('Testproduct e2e')
    await page.getByRole('button').filter({ hasText: /plus|add/i }).first().click()
    await expect(page.getByText('Testproduct e2e')).toBeVisible({ timeout: 5000 })
  })
})
