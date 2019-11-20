// @flow
import fse from 'fs-extra'
import { app, dialog } from 'electron'
import { getFullConfig, handleConfigChange } from '../config'
import {
  readLabwareDirectory,
  parseLabwareFiles,
  addLabwareFile,
} from './definitions'
import { validateLabwareFiles, validateNewLabwareFile } from './validation'
import * as CustomLabware from '@opentrons/app/src/custom-labware'
import * as ConfigActions from '@opentrons/app/src/config'

import type { UncheckedLabwareFile } from '@opentrons/app/src/custom-labware/types'
import type { Action, Dispatch } from '../types'

const ensureDir: (dir: string) => Promise<void> = fse.ensureDir

const fetchCustomLabware = (): Promise<Array<UncheckedLabwareFile>> => {
  const { labware: config } = getFullConfig()

  return ensureDir(config.directory)
    .then(() => readLabwareDirectory(config.directory))
    .then(parseLabwareFiles)
}

const fetchAndValidateCustomLabware = (dispatch: Dispatch): void => {
  // TODO(mc, 2019-11-18): catch errors and tell the UI
  fetchCustomLabware().then(files => {
    const payload = validateLabwareFiles(files)
    dispatch(CustomLabware.customLabware(payload))
  })
}

export function registerLabware(dispatch: Dispatch, mainWindow: {}) {
  handleConfigChange('labware.directory', () => {
    fetchAndValidateCustomLabware(dispatch)
  })

  return function handleActionForLabware(action: Action) {
    switch (action.type) {
      case CustomLabware.FETCH_CUSTOM_LABWARE: {
        fetchAndValidateCustomLabware(dispatch)
        break
      }

      case CustomLabware.CHANGE_CUSTOM_LABWARE_DIRECTORY: {
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

      case CustomLabware.ADD_CUSTOM_LABWARE: {
        const dialogOptions = {
          defaultPath: app.getPath('downloads'),
          properties: ['openFile'],
          filters: [{ name: 'JSON Labware Definitions', extensions: ['json'] }],
        }

        dialog.showOpenDialog(mainWindow, dialogOptions).then(result => {
          const { canceled, filePaths } = result

          if (!canceled && filePaths.length > 0) {
            return Promise.all([
              fetchCustomLabware(),
              parseLabwareFiles(filePaths),
            ]).then(([existingFiles, [newFile]]) => {
              const checkedExisting = validateLabwareFiles(existingFiles)
              const checkedNewFile = validateNewLabwareFile(
                checkedExisting,
                newFile
              )

              if (checkedNewFile.type === CustomLabware.VALID_LABWARE_FILE) {
                return addLabwareFile(
                  checkedNewFile.filename,
                  getFullConfig().labware.directory
                ).then(() => fetchAndValidateCustomLabware(dispatch))
              } else {
                dispatch(CustomLabware.addCustomLabwareFailure(checkedNewFile))
              }
            })
          }
        })

        break
      }
    }
  }
}
