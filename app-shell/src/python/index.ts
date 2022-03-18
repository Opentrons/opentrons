import path from 'path'
import fs from 'fs'
import { PythonShell } from 'python-shell'
import execa from 'execa'

import { createLogger } from '../log'

const log = createLogger('python')

function findPython(): string | undefined {
  let possiblePythonPaths = [
    path.join(process.resourcesPath, 'python', 'bin', 'opentrons_simulate'),
  ]

  if (process.env.NODE_ENV !== 'production') {
    possiblePythonPaths = [
      ...possiblePythonPaths,
      path.join(__dirname, '../python/bin/opentrons'),
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
    execa(pythonPath, ['analyze', '--json', filePath])
      .then(output => log.info('python out', output))
      .catch(log.error)
  }

  // PythonShell.run(filePath, { mode: 'text', pythonPath }, (err, results) => {
  //   if (err) throw err
  //   // results is an array consisting of messages collected during execution
  //   log.info(`results: ${results}`)
  // })
}
