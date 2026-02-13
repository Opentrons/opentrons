/**
 * Dev-mode Electron app fixture for Playwright.
 *
 * Instead of launching the installed (production) Opentrons application,
 * this fixture launches the Electron shell from the monorepo source tree
 * in development mode — the same way `make -C app dev` does.
 *
 * How it works:
 *   1. Starts the Vite dev-server (`vite serve` in `../app/`) on a free port.
 *   2. Builds the app-shell with `vite build` in `../app-shell/`.
 *   3. Launches Electron with dev-mode flags that point at the local Vite URL.
 *   4. Tears everything down after tests finish.
 *
 * Configuration (environment variables):
 *   DEV_PORT              – Port for the Vite dev-server (default: 5173)
 *   APP_STARTUP_TIMEOUT   – ms to wait for the first window (default: 60 000)
 *   MONOREPO_ROOT         – Path to the opentrons monorepo root (default: auto-detected)
 *   SKIP_SHELL_BUILD      – Set to "true" to skip `vite build` in app-shell (if already built)
 */

import { type ChildProcess, exec, execSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  _electron,
  test as base,
  type ElectronApplication,
  type Page,
} from '@playwright/test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the monorepo root directory. */
function resolveMonorepoRoot(): string {
  const explicit = process.env.MONOREPO_ROOT
  if (explicit) {
    if (!existsSync(explicit)) {
      throw new Error(
        `MONOREPO_ROOT is set to '${explicit}' but the path does not exist.`,
      )
    }
    return explicit
  }

  // Default: e2e-testing/app/ is two levels below the monorepo root
  const inferred = resolve(__dirname, '..', '..', '..')
  const marker = resolve(inferred, 'app-shell', 'package.json')
  if (!existsSync(marker)) {
    throw new Error(
      `Could not auto-detect monorepo root (expected app-shell/package.json at ${marker}).\n` +
        'Set the MONOREPO_ROOT environment variable.',
    )
  }
  return inferred
}

/** Wait for a URL to respond with 2xx, polling every `interval` ms. */
async function waitForUrl(
  url: string,
  timeout: number,
  interval = 1000,
): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // server not ready yet
    }
    await new Promise(r => setTimeout(r, interval))
  }
  throw new Error(`Timed out waiting for ${url} after ${timeout}ms`)
}

/** Find an available TCP port. Prefers `preferred` if it's free. */
async function findFreePort(preferred: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', () => {
      // preferred port is taken — let the OS pick one
      const fallback = createServer()
      fallback.once('error', reject)
      fallback.listen(0, () => {
        const addr = fallback.address()
        const port = typeof addr === 'object' && addr ? addr.port : 0
        fallback.close(() => resolve(port))
      })
    })
    server.listen(preferred, () => {
      server.close(() => resolve(preferred))
    })
  })
}

/** Run a shell command and return a promise that resolves on exit 0. */
function runCommand(command: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = exec(command, {
      cwd,
      env: { ...process.env, NODE_ENV: 'development' },
    })
    proc.stdout?.pipe(process.stdout)
    proc.stderr?.pipe(process.stderr)
    proc.on('exit', code => {
      if (code === 0) resolve()
      else reject(new Error(`Command '${command}' exited with code ${code}`))
    })
    proc.on('error', reject)
  })
}

/**
 * Resolve the Python 3.12 executable from the api/ project's uv environment.
 *
 * This mirrors the `PYTHON_OVERRIDE_COMMAND` in app-shell/Makefile:
 *   cd ../api && uv run --python 3.12 python -c "import sys, pathlib; print(pathlib.Path(sys.executable))"
 *
 * Can be overridden with the `PYTHON_PATH_OVERRIDE` environment variable.
 */
function resolvePythonPath(monorepoRoot: string): string {
  const explicit = process.env.PYTHON_PATH_OVERRIDE
  if (explicit) {
    if (!existsSync(explicit)) {
      throw new Error(
        `PYTHON_PATH_OVERRIDE is set to '${explicit}' but the path does not exist.`,
      )
    }
    console.log(`→ Using PYTHON_PATH_OVERRIDE: ${explicit}`)
    return explicit
  }

  const apiDir = resolve(monorepoRoot, 'api')
  console.log(`→ Resolving Python 3.12 path from ${apiDir} …`)

  try {
    const pythonPath = execSync(
      'uv run --python 3.12 python -c "import sys, pathlib; print(pathlib.Path(sys.executable))"',
      { cwd: apiDir, encoding: 'utf-8', timeout: 30_000 },
    ).trim()

    if (!existsSync(pythonPath)) {
      throw new Error(
        `Resolved Python path '${pythonPath}' does not exist.\n` +
          'Run `cd api && make setup` to set up the Python environment.',
      )
    }

    console.log(`✓ Python 3.12 resolved: ${pythonPath}`)
    return pythonPath
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Failed to resolve Python 3.12 from api/ project.\n` +
        `Ensure 'uv' is installed and run 'cd api && make setup'.\n` +
        `Error: ${msg}`,
    )
  }
}

// ---------------------------------------------------------------------------
// Fixture types
// ---------------------------------------------------------------------------

export interface DevAppFixtures {
  /** The launched Electron application handle (dev mode). */
  electronApp: ElectronApplication
  /** The main BrowserWindow page (dev mode). */
  appWindow: Page
  /** Convenience alias for `appWindow` with a default timeout applied. */
  appPage: Page
}

// ---------------------------------------------------------------------------
// Extended test with dev-mode fixtures
// ---------------------------------------------------------------------------

/**
 * Extended Playwright `test` that provides dev-mode Electron app fixtures.
 *
 * Usage:
 * ```ts
 * import { test, expect } from '../fixtures/electron-dev';
 *
 * test('dev app launches', async ({ appPage }) => {
 *   await expect(appPage).toHaveTitle(/Opentrons/);
 * });
 * ```
 */
export const test = base.extend<object, DevAppFixtures>({
  // --- Worker-scoped fixtures (shared across tests in a worker) -----------

  electronApp: [
    // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture API requires destructured arg
    async ({}, use) => {
      const monorepoRoot = resolveMonorepoRoot()
      const appDir = resolve(monorepoRoot, 'app')
      const appShellDir = resolve(monorepoRoot, 'app-shell')

      const preferredPort = Number(process.env.DEV_PORT ?? 5173)
      const port = await findFreePort(preferredPort)
      const startupTimeout = Number(process.env.APP_STARTUP_TIMEOUT ?? 60_000)
      const skipShellBuild = process.env.SKIP_SHELL_BUILD === 'true'

      const devServerUrl = `http://localhost:${port}`

      // 1. Start Vite dev-server in app/ -----------------------------------
      console.log(`\n→ Starting Vite dev-server on port ${port} …`)
      const viteProc: ChildProcess = spawn(
        'npx',
        ['vite', 'serve', '--port', String(port), '--strictPort'],
        {
          cwd: appDir,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: {
            ...process.env,
            NODE_ENV: 'development',
            PORT: String(port),
          },
          // Ensure the child runs in its own process group so we can kill it
          detached: true,
        },
      )

      viteProc.stdout?.on('data', (data: Buffer) => {
        const line = data.toString().trim()
        if (line) console.log(`  [vite] ${line}`)
      })

      viteProc.stderr?.on('data', (data: Buffer) => {
        const line = data.toString().trim()
        if (line) console.log(`  [vite:err] ${line}`)
      })

      // Wait for the dev-server to be reachable
      console.log(`→ Waiting for Vite dev-server at ${devServerUrl} …`)
      await waitForUrl(devServerUrl, startupTimeout)
      console.log('✓ Vite dev-server is ready')

      // 2. Build app-shell (vite build) ------------------------------------
      if (skipShellBuild) {
        console.log('→ Skipping app-shell build (SKIP_SHELL_BUILD=true)')
      } else {
        console.log('→ Building app-shell (vite build) …')
        await runCommand('npx vite build', appShellDir)
        console.log('✓ app-shell built')
      }

      // 3. Launch Electron with dev flags ----------------------------------
      console.log('→ Launching Electron in dev mode …')

      // Resolve Python so the app can analyse protocols.
      const pythonPath = resolvePythonPath(monorepoRoot)

      // On CI (Linux without root), the SUID sandbox cannot be configured.
      // Pass --no-sandbox to work around this.
      const electronArgs = [
        '.',
        '--devtools',
        '--log.level.console=debug',
        '--disable_ui.webPreferences.webSecurity',
        `--ui.url.protocol=http:`,
        `--ui.url.path=localhost:${port}`,
        `--python.pathToPythonOverride=${pythonPath}`,
      ]
      if (process.env.CI) {
        electronArgs.push('--no-sandbox')
      }

      let app: ElectronApplication | undefined
      try {
        app = await _electron.launch({
          args: electronArgs,
          cwd: appShellDir,
          timeout: startupTimeout,
          env: {
            ...process.env,
            NODE_ENV: 'development',
          },
        })
        console.log('✓ Electron dev app launched')

        await use(app)
      } finally {
        // --- Teardown (runs even if launch or tests fail) -----------------
        if (app) {
          console.log('\n→ Closing dev Electron app …')
          await app.close()
          console.log('✓ Electron app closed')
        }

        console.log('→ Stopping Vite dev-server …')
        // Kill the process tree (Vite may spawn children).
        const pid = viteProc.pid
        if (pid) {
          try {
            // Kill the whole process group on Unix
            process.kill(-pid, 'SIGTERM')
          } catch {
            viteProc.kill('SIGTERM')
          }
        } else {
          viteProc.kill('SIGTERM')
        }
        await new Promise<void>(resolve => {
          const timer = setTimeout(() => {
            try {
              if (pid) process.kill(-pid, 'SIGKILL')
              else viteProc.kill('SIGKILL')
            } catch {
              // already dead
            }
            resolve()
          }, 5000)
          viteProc.on('exit', () => {
            clearTimeout(timer)
            resolve()
          })
        })
        console.log('✓ Vite dev-server stopped')
      }
    },
    { scope: 'worker' },
  ],

  appWindow: [
    async ({ electronApp }, use) => {
      // The --devtools flag causes DevTools to open as the first window.
      // We need to find the actual app window, not the DevTools window.
      const findAppWindow = (): Page | undefined => {
        return electronApp
          .windows()
          .find(w => !w.url().startsWith('devtools://'))
      }

      let appWin = findAppWindow()

      // If the app window hasn't appeared yet, wait for new windows.
      if (!appWin) {
        const maxAttempts = 30
        for (let i = 0; i < maxAttempts && !appWin; i++) {
          await new Promise(r => setTimeout(r, 2000))
          appWin = findAppWindow()
        }
      }

      if (!appWin) {
        const urls = electronApp
          .windows()
          .map(w => w.url())
          .join(', ')
        throw new Error(
          `Could not find the app window. Open windows: [${urls}]`,
        )
      }

      await appWin.waitForLoadState('domcontentloaded', { timeout: 60_000 })
      console.log(
        `✓ Dev app window ready – title: "${await appWin.title()}", url: ${appWin.url()}`,
      )

      await use(appWin)
    },
    { scope: 'worker' },
  ],

  // --- Test-scoped fixture ------------------------------------------------

  appPage: [
    async ({ appWindow }, use) => {
      appWindow.setDefaultTimeout(15_000)
      await use(appWindow)
    },
    { scope: 'worker' },
  ],
})

export { expect } from '@playwright/test'
