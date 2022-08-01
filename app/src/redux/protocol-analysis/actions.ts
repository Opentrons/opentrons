export const OPEN_PYTHON_DIRECTORY: 'protocol-analysis:OPEN_PYTHON_DIRECTORY' =
  'protocol-analysis:OPEN_PYTHON_DIRECTORY'

export const CHANGE_PYTHON_PATH_OVERRIDE: 'protocol-analysis:CHANGE_PYTHON_PATH_OVERRIDE' =
  'protocol-analysis:CHANGE_PYTHON_PATH_OVERRIDE'
export interface OpenPythonInterpreterDirectoryAction {
  type: typeof OPEN_PYTHON_DIRECTORY
  meta: { shell: true }
}

export interface ChangePythonPathOverrideConfigAction {
  type: typeof CHANGE_PYTHON_PATH_OVERRIDE
  meta: { shell: true }
}

export type ProtocolAnalysisAction =
  | OpenPythonInterpreterDirectoryAction
  | ChangePythonPathOverrideConfigAction

export const openPythonInterpreterDirectory = (): OpenPythonInterpreterDirectoryAction => ({
  type: OPEN_PYTHON_DIRECTORY,
  meta: { shell: true },
})

export const changePythonPathOverrideConfig = (): ChangePythonPathOverrideConfigAction => ({
  type: CHANGE_PYTHON_PATH_OVERRIDE,
  meta: { shell: true },
})
