import path from 'path'
import fs from 'fs'
import execa from 'execa'

import { createLogger } from '../log'

const log = createLogger('python')

function findPython(): string | undefined {
  let possiblePythonPaths = [
    // TODO: read from redux config python paths first
    path.join(process.resourcesPath, 'python'),
    path.join(process.resourcesPath, 'python', 'bin', 'python3'),
  ]

  if (process.env.NODE_ENV !== 'production') {
    possiblePythonPaths = [
      ...possiblePythonPaths,
      path.join(__dirname, '../python/bin/python3'),
    ]
  }

  for (const path of possiblePythonPaths) {
    if (fs.existsSync(path)) {
      return path
    }
  }
}

export function runFileWithPython(filePath: string): void {
  const pythonPath = findPython()

  log.debug('SUP', { pythonPath, filePath })
  if (pythonPath != null) {
    log.debug('HEYYY', pythonPath, filePath)
    execa(pythonPath, [
      '-m',
      'opentrons.cli.__init__',
      'analyze',
      '--json',
      filePath,
    ])
      .then(output => log.info('python out', output))
      .catch(log.error)
  }
}
