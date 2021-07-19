import { Page } from 'playwright'
import { test } from './electron-test'
import { expect } from '@playwright/test'
import { RobotPage } from './models/robot-page'

async function dismissUpdateModal(window: Page): Promise<void> {
  const updateDialog = await window.$('text=Not Now')
  if (updateDialog != null) {
    await updateDialog.click()
    await window.waitForSelector('text=Not Now', { state: 'hidden' })
  }
}

test('Initial Application Load', async ({ electronApp }) => {
  const window: Page = await electronApp.firstWindow()
  const robotPage: RobotPage = new RobotPage(window)
  await robotPage.robotMenuClick()
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

test('dev successfully connected banner present', async ({
  electronApp,
}) => {
  const window = await electronApp.firstWindow()
  const robotPage: RobotPage = new RobotPage(window)
  await robotPage.robotMenuClick()
  await dismissUpdateModal(window)
  await robotPage.clickRobotByName('DEV'.toLocaleLowerCase())
  await window.waitForSelector('span:has-text("dev successfully connected")', {
    state: 'visible',
  })
})
