import fs from 'fs'
import path from 'path'
import { createLogger } from '../log'

const log = createLogger('protocol-analysis/getPythonPath')

let pythonPath: string | null = null

export function selectPythonPath(pythonOverride: string | null): void {
  // default candidates for posix and windows
  let candidates = [
    path.join(process.resourcesPath ?? './', 'python/bin/python3'),
    path.join(process.resourcesPath ?? './', 'python/python.exe'),
  ]

  // add override path, posix path, and windows path at front of candidates
  if (typeof pythonOverride === 'string') {
    candidates = [
      pythonOverride,
      path.join(pythonOverride, 'bin/python3'),
      path.join(pythonOverride, 'python.exe'),
      path.join(pythonOverride, 'scripts/python.exe'),
      ...candidates,
    ]
  }

  pythonPath = candidates.filter(testPythonPath)[0] ?? null

  if (pythonPath !== null) {
    log.info('Python environment selected', { pythonPath })
  } else {
    log.error('No valid Python environment found', { candidates })
  }
}

export function getPythonPath(): Promise<string> {
  return pythonPath === null
    ? Promise.reject(new Error('Unable to access Python environment.'))
    : Promise.resolve(pythonPath)
}

function testPythonPath(path: string): boolean {
  try {
    fs.accessSync(path, fs.constants.X_OK)
    const stats = fs.statSync(path)

    if (stats.isFile()) {
      return true
    } else {
      log.debug('Python candidate is not a file, skipping', { path })
    }
  } catch (error) {
    log.debug('Python candidate not executable, skipping', { path })
  }

  return false
}
