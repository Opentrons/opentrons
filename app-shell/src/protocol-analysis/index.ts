import { createLogger } from '../log'
import { getConfig, handleConfigChange } from '../config'

import { getValidLabwareFilePaths } from '../labware'
import { selectPythonPath, getPythonPath } from './getPythonPath'
import { executeAnalyzeCli } from './executeAnalyzeCli'
import { writeFailedAnalysis } from './writeFailedAnalysis'

const log = createLogger('protocol-analysis')

export function initializePython(): void {
  const pathToPythonOverride = getConfig().python.pathToPythonOverride
  selectPythonPath(pathToPythonOverride)

  handleConfigChange('python.pathToPythonOverride', newValue => {
    selectPythonPath(newValue)
  })
}

export function analyzeProtocolSource(
  sourcePath: string,
  outputPath: string
): Promise<void> {
  return Promise.all([getPythonPath(), getValidLabwareFilePaths()])
    .then(([pythonPath, customLabwarePaths]) => {
      const sourcePaths = [sourcePath, ...customLabwarePaths]
      return executeAnalyzeCli(pythonPath, outputPath, sourcePaths)
    })
    .then(() => {
      log.debug(`Analysis of ${sourcePath} written to ${outputPath}`)
    })
    .catch((error: Error) => {
      log.error('Unexpected protocol analysis failure', { sourcePath, error })
      return writeFailedAnalysis(outputPath, error.message)
    })
}
