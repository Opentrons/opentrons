/**
 * Page object for the Protocols landing page.
 *
 * Handles protocol import (via file chooser), locating protocol
 * cards, and navigating into a specific protocol's detail view.
 */

import { resolve } from 'node:path'
import { expect, type Locator, type Page } from '@playwright/test'

export class ProtocolsPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  // ---------------- Navigation -------------------------------------------

  /** Navigate to the protocols page via the left-hand nav. */
  async navigateToProtocols(): Promise<void> {
    // Click the "Protocols" link in the desktop nav sidebar.
    const protocolsLink = this.page.getByRole('link', { name: 'Protocols' })
    await expect(protocolsLink).toBeVisible({ timeout: 15_000 })
    await protocolsLink.click()
    console.log('Navigated to Protocols page')
  }

  // ---------------- Import -----------------------------------------------

  /**
   * Import a protocol file into the app.
   *
   * Handles two UI states:
   * - **Empty state** (no protocols): The upload input is displayed
   *   directly on the page — no slideout needed.
   * - **List state** (protocols exist): Click the "Import" button to
   *   open the slideout, then set the file.
   *
   * @param filePath - Absolute or relative path to the protocol file.
   *   Relative paths are resolved from the e2e-testing/app directory.
   */
  async importProtocol(filePath: string): Promise<void> {
    const absolutePath = resolve(filePath)
    console.log(`Importing protocol: ${absolutePath}`)

    // If the Import button is visible, click it to open the slideout.
    // In the empty state the file input is already on the page.
    const importButton = this.page.getByRole('button', { name: 'Import' })
    if (await importButton.isVisible()) {
      await importButton.click()
      console.log('Opened import slideout')
    } else {
      console.log('Empty state — file input already on page')
    }

    const fileInput = this.page.getByTestId('file_input')
    await fileInput.setInputFiles(absolutePath)
    console.log('Protocol file selected for upload')
  }

  // ---------------- Protocol Cards ---------------------------------------

  /** Return the locator for a protocol card by its display name. */
  getProtocolCard(protocolName: string): Locator {
    return this.page.getByTestId(`ProtocolCard_${protocolName}`)
  }

  /** Click a protocol card to navigate to its detail page. */
  async openProtocol(protocolName: string): Promise<void> {
    const card = this.getProtocolCard(protocolName).first()
    await expect(card).toBeVisible({ timeout: 15_000 })
    await card.click()
    console.log(`Opened protocol: ${protocolName}`)
  }

  // ---------------- Assertions -------------------------------------------

  /** Assert that the protocols page heading is visible. */
  async expectPageLoaded(): Promise<void> {
    // Wait for either the "Import" button (protocols exist) or the
    // empty state text (no protocols yet).
    const importButton = this.page.getByRole('button', { name: 'Import' })
    const emptyState = this.page.getByText('Import a protocol to get started')
    await expect(importButton.or(emptyState)).toBeVisible({ timeout: 15_000 })
    console.log('Protocols page loaded')
  }

  /** Assert that a protocol with the given name appears in the list. */
  async expectProtocolVisible(protocolName: string): Promise<void> {
    const card = this.getProtocolCard(protocolName).first()
    await expect(card).toBeVisible({ timeout: 30_000 })
    console.log(`Protocol "${protocolName}" is visible`)
  }
}
