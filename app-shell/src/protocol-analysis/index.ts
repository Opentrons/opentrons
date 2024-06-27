import { createLogger } from '../log'
import { getConfig, handleConfigChange } from '../config'
import { updateConfigValue } from '../config/actions'
import { getValidLabwareFilePaths } from '../labware'
import {
  showOpenDirectoryDialog,
  openDirectoryInFileExplorer,
} from '../dialogs'
import {
  CHANGE_PYTHON_PATH_OVERRIDE,
  OPEN_PYTHON_DIRECTORY,
} from '../constants'
import { selectPythonPath, getPythonPath } from './getPythonPath'
import { executeAnalyzeCli } from './executeAnalyzeCli'
import { writeFailedAnalysis } from './writeFailedAnalysis'

import type { BrowserWindow } from 'electron'
import type { Action, Dispatch } from '../types'

const log = createLogger('protocol-analysis')

export const CONFIG_PYTHON_PATH_TO_PYTHON_OVERRIDE =
  'python.pathToPythonOverride'

export function registerProtocolAnalysis(
  dispatch: Dispatch,
  mainWindow: BrowserWindow
): (action: Action) => void {
  const pathToPythonOverride = getConfig().python.pathToPythonOverride
  selectPythonPath(pathToPythonOverride)

  handleConfigChange(CONFIG_PYTHON_PATH_TO_PYTHON_OVERRIDE, newValue => {
    selectPythonPath(newValue)
  })

  return function handleIncomingAction(action: Action): void {
    switch (action.type) {
      case OPEN_PYTHON_DIRECTORY: {
        const dir = getConfig().python.pathToPythonOverride
        openDirectoryInFileExplorer(dir).catch(err => {
          log.debug('Error opening python directory', err.message)
        })
        break
      }
      case CHANGE_PYTHON_PATH_OVERRIDE: {
        showOpenDirectoryDialog(mainWindow)
          .then(filePaths => {
            if (filePaths.length > 0) {
              const nextValue = filePaths[0]
              dispatch(
                updateConfigValue(
                  CONFIG_PYTHON_PATH_TO_PYTHON_OVERRIDE,
                  nextValue
                )
              )
            }
          })
          .catch(err => {
            log.debug('Error changing python path override', err.message)
          })
        break
      }
    }
  }
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
