import path from 'path'
import fs from 'fs'
import { PythonShell } from 'python-shell'

import { createLogger } from '../log'
import { Path } from '@thi.ng/paths'

const log = createLogger('python')

const PYTHON_DEV_DIR_BY_PLATFORM: {
  [platforms in NodeJS.Platform]?: string
} = {
  darwin: 'python_mac',
  linux: 'python_linux',
  win32: 'python_windows',
}

function getPythonDevDirPath(): Path | null {
  const { platform } = process

  const pythonDevDir =
    PYTHON_DEV_DIR_BY_PLATFORM[
      platform as keyof typeof PYTHON_DEV_DIR_BY_PLATFORM
    ]
  if (pythonDevDir == null) {
    log.warn(`No python build inlcuded for platform ${platform}`)
    return null
  } else {
    return path.join(__dirname, pythonDevDir, 'bin', 'python3.10')
  }
}

function findPython() {
  let possiblePythonPaths = [
    path.join(process.resourcesPath, 'python', 'bin', 'python3.10'),
  ]

  if (process.env.NODE_ENV !== 'production')
    possiblePythonPaths = [
      ...possiblePythonPaths,
      path.join(
        __dirname,
        PYTHON_DEV_DIR_BY_PLATFORM[process.platform] ?? 'python',
        'bin',
        'python3.10'
      ),
    ]

  for (const path of possiblePythonPaths) {
    if (fs.existsSync(path)) {
      return path
    }
  }
}

export function runFileWithPython(filePath: string) {
  const pythonPath = findPython()

  PythonShell.run(filePath, { mode: 'text', pythonPath }, (err, results) => {
    if (err) throw err
    // results is an array consisting of messages collected during execution
    log.info(`results: ${results}`)
  })
}
