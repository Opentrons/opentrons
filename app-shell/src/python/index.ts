import path from 'path'
import fs from 'fs-extra'
import execa from 'execa'

import { createLogger } from '../log'
import { getConfig } from '../config'

const log = createLogger('python')

let pythonPath: string | null = null

export function initializePython(): void {
  const pathToPythonOverride: string | null = getConfig('python')
    .pathToPythonOverride

  let possiblePythonPaths = [
    path.join(process.resourcesPath ?? './', 'python'),
    path.join(process.resourcesPath ?? './', 'python', 'bin', 'python3'),
  ]

  if (pathToPythonOverride != null) {
    possiblePythonPaths = [
      pathToPythonOverride,
      path.join(pathToPythonOverride, 'bin/python3'),
      ...possiblePythonPaths,
    ]
  }

  if (process.env.NODE_ENV !== 'production') {
    possiblePythonPaths = [
      ...possiblePythonPaths,
      path.join(__dirname, '../python/bin/python3'),
    ]
  }

  for (const path of possiblePythonPaths) {
    try {
      fs.accessSync(path, fs.constants.X_OK)
      const stats = fs.statSync(path)
      if (stats.isFile()) {
        log.info('Python environment selected', { path })
        pythonPath = path
      }
    } catch (error) {
      log.debug('Python candidate not executable, skipping', { path, error })
    }
  }

  if (pythonPath == null) {
    log.error('No valid Python environment found')
  }
}

export function runFileWithPython(
  srcFilePath: string,
  destFilePath: string
): Promise<void> {
  if (pythonPath === null) {
    return Promise.reject(
      new Error('No Python interpreter set, was `initializePython` called?')
    )
  }

  return execa(pythonPath, [
    '-m',
    'opentrons.cli',
    'analyze',
    '--json',
    srcFilePath,
  ])
    .then(output => {
      log.debug('python output: ', output)
      fs.writeFile(destFilePath, output.stdout)
    })
    .catch(e => {
      log.error(e)
    })
}
