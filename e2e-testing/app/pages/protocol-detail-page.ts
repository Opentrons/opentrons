/**
 * Page object for the Protocol Detail page.
 *
 * Provides helpers for interacting with the protocol detail view,
 * including navigating to the visualization view.
 */

import { expect, type Locator, type Page } from '@playwright/test'

export class ProtocolDetailPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  // ---------------- Navigation -------------------------------------------

  /** Click the "Visualize" button to enter the visualization view. */
  async openVisualization(): Promise<void> {
    const visualizeButton = this.page.getByRole('button', {
      name: 'Visualize',
    })
    await expect(visualizeButton).toBeVisible({ timeout: 15_000 })
    await visualizeButton.click()
    console.log('Opened visualization view')
  }

  // ---------------- Queries ----------------------------------------------

  /** Return the deck map locator. */
  getDeckMap(): Locator {
    return this.page.getByTestId('ProtocolDetails_deckMap')
  }

  /** Return the "Start setup" button locator. */
  getStartSetupButton(): Locator {
    return this.page.getByTestId('ProtocolDetails_runProtocol')
  }

  // ---------------- Assertions -------------------------------------------

  /** Assert the protocol detail page is loaded. */
  async expectPageLoaded(): Promise<void> {
    // Wait for the Visualize button (Flex protocols) or Start setup button.
    const visualize = this.page.getByRole('button', { name: 'Visualize' })
    await expect(visualize).toBeVisible({ timeout: 30_000 })
    console.log('Protocol detail page loaded')
  }

  /** Assert the protocol description contains the expected text. */
  async expectDescription(text: string): Promise<void> {
    const description = this.page.getByTestId('ProtocolDetails_description')
    await expect(description).toContainText(text)
  }
}
