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

  let pythonCandidates = [
    path.join(process.resourcesPath ?? './', 'python', 'bin', 'python3'),
  ]

  if (pathToPythonOverride != null) {
    pythonCandidates = [
      pathToPythonOverride,
      path.join(pathToPythonOverride, 'bin/python3'),
      ...pythonCandidates,
    ]
  }

  pythonPath = pythonCandidates.filter(testPythonPath)[0] ?? null

  if (pythonPath != null)
    log.info('Python environment selected', { pythonPath })
  else {
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

function testPythonPath(candidatePath: string): boolean {
  try {
    fs.accessSync(candidatePath, fs.constants.X_OK)
    const stats = fs.statSync(candidatePath)

    if (stats.isFile()) {
      return true
    }
  } catch (error) {
    log.debug('Python candidate not executable, skipping', {
      candidatePath,
      error,
    })
  }

  return false
}
