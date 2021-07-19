import type { Page } from 'playwright'

export class RobotPage {
  readonly page: Page
  readonly robotMenuSelector: string = '[href="#/robots"]'

  constructor(page: Page) {
    this.page = page
  }

  async robotMenuClick(): Promise<void> {
    await this.page.click(this.robotMenuSelector)
  }

  async clickRobotByName(robotName: string): Promise<void> {
    await this.page.click(`//a[contains(@href,${robotName})]//button`)
  }
}
