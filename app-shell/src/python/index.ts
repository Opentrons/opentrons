import path from 'path'
import fs from 'fs'
import { PythonShell } from 'python-shell'

import { createLogger } from '../log'

const log = createLogger('python')

function findPython() {
  const possibilities = [
    // In packaged app
    path.join(process.resourcesPath, 'python', 'bin', 'python3.10'),
    // In development
    path.join(__dirname, 'python', 'bin', 'python3.10'),
  ]
  for (const path of possibilities) {
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
