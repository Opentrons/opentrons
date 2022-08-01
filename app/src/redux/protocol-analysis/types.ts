import * as Constants from './constants'

export interface OpenPythonInterpreterDirectoryAction {
  type: typeof Constants.OPEN_PYTHON_DIRECTORY
  meta: { shell: true }
}

export interface ChangePythonPathOverrideConfigAction {
  type: typeof Constants.CHANGE_PYTHON_PATH_OVERRIDE
  meta: { shell: true }
}

export type ProtocolAnalysisAction =
  | OpenPythonInterpreterDirectoryAction
  | ChangePythonPathOverrideConfigAction
