/**
 * Electron app fixture for Playwright.
 *
 * Uses Playwright's native `_electron.launch()` API to start the
 * installed Opentrons desktop application.  This gives us:
 *
 *   - No manual subprocess or CDP port management
 *   - Direct access to `ElectronApplication.evaluate()` for calling
 *     Node.js / Electron main-process APIs
 *   - Automatic cleanup on teardown
 *
 * Configuration (environment variables):
 *   OPENTRONS_APP_PATH     – path to the Electron binary or .app bundle
 *   APP_STARTUP_TIMEOUT    – ms to wait for the first window (default 30 000)
 */

import { existsSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';

import { _electron, test as base, type ElectronApplication, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the Opentrons Electron executable path. */
function resolveExecutable(): string {
  const explicit = process.env.OPENTRONS_APP_PATH;
  if (explicit) {
    if (explicit.endsWith('.app')) {
      const inner = join(explicit, 'Contents', 'MacOS', 'Opentrons');
      if (existsSync(inner)) return inner;
    }
    if (existsSync(explicit)) return explicit;
    throw new Error(`OPENTRONS_APP_PATH is set to '${explicit}' but the path does not exist.`);
  }

  const os = platform();
  const candidates: string[] = [];

  if (os === 'darwin') {
    candidates.push(
      '/Applications/Opentrons.app/Contents/MacOS/Opentrons',
      join(homedir(), 'Applications', 'Opentrons.app', 'Contents', 'MacOS', 'Opentrons'),
    );
  } else if (os === 'linux') {
    candidates.push(
      '/usr/bin/opentrons',
      '/opt/Opentrons/opentrons',
      join(homedir(), 'Opentrons.AppImage'),
    );
  } else if (os === 'win32') {
    const localAppData = process.env.LOCALAPPDATA ?? '';
    candidates.push(join(localAppData, 'Programs', 'Opentrons', 'Opentrons.exe'));
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  const searched = candidates.map((c) => `  ${c}`).join('\n');
  throw new Error(
    `Could not find the Opentrons application.\n` +
      `Set the OPENTRONS_APP_PATH environment variable or install the app.\n` +
      `Searched:\n${searched}`,
  );
}

// ---------------------------------------------------------------------------
// Fixture types
// ---------------------------------------------------------------------------

export interface AppFixtures {
  /** The launched Electron application handle. */
  electronApp: ElectronApplication;
  /** The main BrowserWindow page. */
  appWindow: Page;
  /** Convenience alias for `appWindow` with a default timeout applied. */
  appPage: Page;
}

// ---------------------------------------------------------------------------
// Extended test with app fixtures
// ---------------------------------------------------------------------------

/**
 * Extended Playwright `test` that provides Electron app fixtures.
 *
 * Usage:
 * ```ts
 * import { test, expect } from '../fixtures/electron-app';
 *
 * test('app launches', async ({ appPage }) => {
 *   await expect(appPage).toHaveTitle(/Opentrons/);
 * });
 * ```
 */
export const test = base.extend<object, AppFixtures>({
  // --- Worker-scoped fixtures (shared across tests in a worker) -----------

  electronApp: [
    // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture API requires destructured arg
    async ({}, use) => {
      const appPath = resolveExecutable();
      const startupTimeout = Number(process.env.APP_STARTUP_TIMEOUT ?? 30_000);

      console.log(`\n✓ Opentrons app found at ${appPath}`);
      console.log('Launching Opentrons app via Playwright Electron API …');

      const app = await _electron.launch({
        executablePath: appPath,
        timeout: startupTimeout,
      });

      console.log('✓ Electron app launched');

      await use(app);

      console.log('\nClosing Opentrons app …');
      await app.close();
      console.log('✓ Electron app closed');
    },
    { scope: 'worker' },
  ],

  appWindow: [
    async ({ electronApp }, use) => {
      // firstWindow() waits for the first BrowserWindow to open.
      const window = await electronApp.firstWindow();
      await window.waitForLoadState('domcontentloaded', { timeout: 30_000 });
      console.log(`✓ App window ready – title: "${await window.title()}", url: ${window.url()}`);

      await use(window);
    },
    { scope: 'worker' },
  ],

  // --- Test-scoped fixture ------------------------------------------------

  appPage: [
    async ({ appWindow }, use) => {
      appWindow.setDefaultTimeout(10_000);
      await use(appWindow);
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
