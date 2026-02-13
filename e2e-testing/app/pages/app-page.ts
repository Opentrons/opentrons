/**
 * Page object for the main Opentrons desktop application window.
 *
 * Provides convenience helpers for common queries and assertions
 * on the Electron app's BrowserWindow.
 */

import { expect, type Locator, type Page } from '@playwright/test'

export class AppPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  // ---------------- Waits ------------------------------------------------

  /** Wait until the application window has meaningful content. */
  async waitForReady(timeout = 30_000): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded', { timeout })
  }

  /**
   * Dismiss any modals that appear automatically on a fresh app launch.
   *
   * Currently handles:
   * - **SystemLanguagePreferenceModal** — shown when no language preference
   *   is stored (first boot). Dismissed by clicking "Continue".
   */
  async dismissStartupModals(): Promise<void> {
    // SystemLanguagePreferenceModal — "Continue" button on first boot.
    const continueButton = this.page.getByRole('button', { name: 'Continue' })
    try {
      await continueButton.click({ timeout: 10_000 })
      console.log('Dismissed language preference modal')
    } catch {
      // Modal didn't appear — that's fine (not a fresh install).
      console.log('No language preference modal to dismiss')
    }
  }

  // ---------------- Queries ----------------------------------------------

  /** Return the document title of the app window. */
  async getTitle(): Promise<string> {
    return this.page.title()
  }

  /** Locate visible text anywhere in the window. */
  findText(text: string): Locator {
    return this.page.getByText(text).first()
  }

  // ---------------- Assertions -------------------------------------------

  /** Assert that *text* is visible somewhere in the window. */
  async expectVisibleText(text: string, timeout = 10_000): Promise<void> {
    await expect(this.findText(text)).toBeVisible({ timeout })
  }

  /** Assert the window title contains *substring* (case-insensitive). */
  async expectTitleContains(substring: string): Promise<void> {
    const title = await this.getTitle()
    expect(title.toLowerCase()).toContain(substring.toLowerCase())
  }
}
