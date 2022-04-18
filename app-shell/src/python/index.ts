import path from 'path'
import fs from 'fs-extra'
import execa from 'execa'

import { createLogger } from '../log'
import { getConfig } from '../config'

const log = createLogger('python')

function findPython(): string | undefined {
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
        log.debug('Python candidate selected', { path })
        return path
      }
    } catch (error) {
      log.debug('Python candidate not executable, skipping', { path, error })
    }
  }
}

export function analyzeProtocolSource(
  srcFilePath: string,
  destFilePath: string
): Promise<void> {
  const pythonPath = findPython()

  if (pythonPath != null) {
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
      .catch((e: Error) => {
        log.error(e)
        fs.writeJSON(destFilePath, {
          errors: [e.message],
          files: [],
          config: {},
          metadata: [],
          commands: [],
        })
      })
  } else {
    return Promise.reject(new Error('Python interpreter could not be found'))
  }
}
