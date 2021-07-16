import { Page } from 'playwright'
import { test, expect } from '@playwright/test'

async function dismissUpdateModal(page: Page): Promise<void> {
  const updateDialog = await page.$('text=Not Now')
  if (updateDialog) {
    await updateDialog.click()
    await page.waitForSelector('text=Not Now', { state: 'hidden' })
  }
}

async function epoch(): Promise<number> {
  return Math.round(new Date().getTime() / 1000)
}

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:8090')
})

test('Successfully loads page', async ({ page }) => {
  await dismissUpdateModal(page)

  // Click button
  await page.click('button')
  expect(page.url()).toBe('http://localhost:8090/#/robots/opentrons-dev')
  await dismissUpdateModal(page)
  const visible: Boolean = await page.isVisible(':is(h2:has-text("Robots"))')
  expect(visible).toBeTruthy()
  const hiddenProtocolMenu = await page.textContent(
    '[aria-describedby="Tooltip__2"]'
  )
  expect(hiddenProtocolMenu).toBe('Protocol')
  const hiddenCalibrateMenu = await page.textContent(
    '[aria-describedby="Tooltip__3"]'
  )
  expect(hiddenCalibrateMenu).toBe('Calibrate')
  const hiddenRunMenu = await page.textContent(
    '[aria-describedby="Tooltip__4"]'
  )
  expect(hiddenRunMenu).toBe('Run')
})

test('Successfully loads page 2', async ({ page }) => {
  // Click button
  await page.click('button')
  expect(page.url()).toBe('http://localhost:8090/#/robots/opentrons-dev')

  await dismissUpdateModal(page)
})
