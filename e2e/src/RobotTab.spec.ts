import { Page } from 'playwright'
import { test } from './electron-test'
import { expect } from '@playwright/test'

async function dismissUpdateModal(page: Page): Promise<void> {
  const updateDialog = await page.$('text=Not Now')
  if (updateDialog != null) {
    await updateDialog.click()
    await page.waitForSelector('text=Not Now', { state: 'hidden' })
  }
}

test('use electron', async ({ electronApp }) => {
  const window = await electronApp.firstWindow()
  await window.click('button')
  await dismissUpdateModal(window)
  const visible: Boolean = await window.isVisible(':is(h2:has-text("Robots"))')
  expect(visible).toBeTruthy()
  const hiddenProtocolMenu = await window.textContent(
    '[aria-describedby="Tooltip__2"]'
  )
  expect(hiddenProtocolMenu).toBe('Protocol')
  const hiddenCalibrateMenu = await window.textContent(
    '[aria-describedby="Tooltip__3"]'
  )
  expect(hiddenCalibrateMenu).toBe('Calibrate')
  const hiddenRunMenu = await window.textContent(
    '[aria-describedby="Tooltip__4"]'
  )
  expect(hiddenRunMenu).toBe('Run')
})

test('pause 25 seconds with app open', async ({ electronApp }) => {
  await new Promise(function (resolve) {
    setTimeout(resolve, 25000)
  })
})
