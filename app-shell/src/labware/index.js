// @flow
import fse from 'fs-extra'
import { dialog } from 'electron'
import { getFullConfig, handleConfigChange } from '../config'
import { readLabwareDirectory, parseLabwareFiles } from './definitions'
import { validateLabwareFiles } from './validation'
import * as LabwareActions from '@opentrons/app/src/custom-labware'
import * as ConfigActions from '@opentrons/app/src/config'

import type { Action, Dispatch } from '../types'

const ensureDir: (dir: string) => Promise<void> = fse.ensureDir

const fetchCustomLabware = (dispatch: Dispatch): void => {
  const { labware: config } = getFullConfig()

  // TODO(mc, 2019-11-18): catch errors and tell the UI
  ensureDir(config.directory)
    .then(() => readLabwareDirectory(config.directory))
    .then(parseLabwareFiles)
    .then(files => {
      const payload = validateLabwareFiles(files)
      dispatch(LabwareActions.customLabware(payload))
    })
}

export function registerLabware(dispatch: Dispatch, mainWindow: {}) {
  handleConfigChange('labware.directory', () => fetchCustomLabware(dispatch))

  return function handleActionForLabware(action: Action) {
    switch (action.type) {
      case LabwareActions.FETCH_CUSTOM_LABWARE: {
        fetchCustomLabware(dispatch)
        break
      }

      case LabwareActions.CHANGE_CUSTOM_LABWARE_DIRECTORY: {
        const { labware: config } = getFullConfig()
        const dialogOptions = {
          defaultPath: config.directory,
          properties: ['openDirectory', 'createDirectory'],
        }

        dialog.showOpenDialog(mainWindow, dialogOptions).then(result => {
          const { canceled, filePaths } = result

          if (!canceled && filePaths.length > 0) {
            const dir = filePaths[0]
            dispatch(ConfigActions.updateConfig('labware.directory', dir))
          }
        })
        break
      }
    }
  }
}
