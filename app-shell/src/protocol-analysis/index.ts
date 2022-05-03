import { createLogger } from '../log'
import { getConfig } from '../config'

import { selectPythonPath, getPythonPath } from './getPythonPath'
import { executeAnalyzeCli } from './executeAnalyzeCli'
import { writeFailedAnalysis } from './writeFailedAnalysis'

const log = createLogger('protocol-analysis')

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
    .then(() => {
      log.debug(`Analysis of ${sourcePath} written to ${outputPath}`)
    })
    .catch((error: Error) => {
      log.error('Unexpected protocol analysis failure', { sourcePath, error })
      return writeFailedAnalysis(outputPath, error.message)
    })
}
