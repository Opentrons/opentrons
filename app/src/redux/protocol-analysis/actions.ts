import * as Types from './types'
import * as Constants from './constants'

export const openPythonInterpreterDirectory = (): Types.OpenPythonInterpreterDirectoryAction => ({
  type: Constants.OPEN_PYTHON_DIRECTORY,
  meta: { shell: true },
})

export const changePythonPathOverrideConfig = (): Types.ChangePythonPathOverrideConfigAction => ({
  type: Constants.CHANGE_PYTHON_PATH_OVERRIDE,
  meta: { shell: true },
})
