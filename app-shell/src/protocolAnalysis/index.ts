import path from 'path'
import fs from 'fs-extra'
import execa from 'execa'
import uuid from 'uuid/v4'

import { createLogger } from '../log'
import { getConfig } from '../config'

import { selectPythonPath, getPythonPath } from './getPythonPath'
import { executeAnalyzeCli } from './executeAnalyzeCli'
import { writeFailedAnalysis } from './writeFailedAnalysis'

const log = createLogger('python')

export function initializePython(): void {
  const pathToPythonOverride = getConfig().python.pathToPythonOverride

  selectPythonPath(pathToPythonOverride)
}

export function analyzeProtocolSource(
  sourcePath: string,
  outputPath: string
): Promise<void> {
  return getPythonPath()
    .then(pythonPath => executeAnalyzeCli(pythonPath, sourcePath, outputPath))
    .catch((error: Error) => writeFailedAnalysis(error))
}
