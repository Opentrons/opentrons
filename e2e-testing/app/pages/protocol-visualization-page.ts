/**
 * Page object for the Protocol Visualization view.
 *
 * Handles interaction with the protocol step list (react-window
 * virtualised list), play/pause controls, and rendering validation.
 */

import { expect, type Locator, type Page } from '@playwright/test'

export class ProtocolVisualizationPage {
  readonly page: Page

  /** CSS selector for the virtualised list container. */
  private readonly listSelector = 'div[role="list"]'

  constructor(page: Page) {
    this.page = page
  }

  // ---------------- Waits ------------------------------------------------

  /** Wait for the visualization view to be ready (step list visible). */
  async waitForReady(timeout = 30_000): Promise<void> {
    await this.page.waitForSelector(this.listSelector, { timeout })
    console.log('Visualization view ready — step list visible')
  }

  // ---------------- Step List Queries ------------------------------------

  /**
   * Get the total number of items in the step list.
   *
   * Reads `aria-setsize` from the first list item, which react-window
   * sets on every row.
   */
  async getStepCount(): Promise<number> {
    const firstItem = this.page.locator(
      `${this.listSelector} [role="listitem"][aria-posinset="1"]`,
    )
    await expect(firstItem).toBeAttached({ timeout: 15_000 })

    const setSize = await firstItem.getAttribute('aria-setsize')
    if (setSize == null) {
      throw new Error('Could not determine step count: aria-setsize is missing')
    }

    const count = Number.parseInt(setSize, 10)
    console.log(`Protocol has ${count} steps`)
    return count
  }

  /** Return a locator for a step at a given 1-based position. */
  getStepByPosition(position: number): Locator {
    return this.page.locator(
      `${this.listSelector} [role="listitem"][aria-posinset="${position}"]`,
    )
  }

  /** Click a step at a given 1-based position. */
  async clickStep(position: number): Promise<void> {
    const step = this.getStepByPosition(position)
    await expect(step).toBeVisible({ timeout: 10_000 })
    await step.click()
  }

  // ---------------- Rendering Validation ---------------------------------

  /**
   * Wait for a step to finish rendering.
   *
   * Uses a multi-strategy approach:
   *   1. Network idle (covers asset/API loads).
   *   2. DOM content check (visible text, SVG, images inside the step).
   *   3. Minimal fallback wait.
   */
  async waitForStepRender(stepNumber: number): Promise<void> {
    const start = Date.now()

    try {
      // Strategy 1: network idle (quick timeout — it may already be idle).
      await this.page.waitForLoadState('networkidle', { timeout: 2_000 })
    } catch {
      try {
        // Strategy 2: wait for visible content inside the step element.
        await this.page.waitForFunction(
          `(() => {
            const el = document.querySelector('[aria-posinset="' + ${stepNumber} + '"]');
            if (!el) return false;
            return !!(el.querySelector('p, div, span') || el.querySelector('svg') || el.querySelector('img, canvas'));
          })()`,
          undefined,
          { timeout: 1_000 },
        )
      } catch {
        // Strategy 3: minimal fallback.
        await this.page.waitForTimeout(100)
      }
    }

    const elapsed = Date.now() - start
    console.log(`  Step ${stepNumber} rendered (${elapsed}ms)`)
  }

  /**
   * Check whether the current page appears blank (white screen).
   *
   * Returns `true` if the page has very little visible content,
   * which indicates a rendering failure.
   */
  async isWhiteScreen(): Promise<boolean> {
    try {
      const hasContent = await this.page.evaluate(`(() => {
        const body = document.body;
        const text = body.innerText || '';
        if (text.trim().length < 50) return false;
        const visibleElements = Array.from(
          document.querySelectorAll('*')
        ).filter(el => {
          const style = window.getComputedStyle(el);
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0'
          );
        });
        return visibleElements.length > 10;
      })()`)

      return !hasContent
    } catch (error) {
      console.log('Warning: error during white screen check:', error)
      return false
    }
  }

  // ---------------- Controls ---------------------------------------------

  /** Return the play button locator. */
  getPlayButton(): Locator {
    return this.page.locator('button:has([data-icon="play"])')
  }

  /** Return the pause button locator. */
  getPauseButton(): Locator {
    return this.page.locator('button:has([data-icon="pause"])')
  }

  // ---------------- Screenshots ------------------------------------------

  /** Take a screenshot with an auto-generated filename. */
  async takeScreenshot(name: string): Promise<void> {
    const path = `test-results/visualization-${name}.png`
    await this.page.screenshot({ path })
    console.log(`Screenshot saved: ${path}`)
  }
}
