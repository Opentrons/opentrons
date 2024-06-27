import fse from 'fs-extra'
import { app, shell } from 'electron'
import { getFullConfig, handleConfigChange } from '../config'
import { showOpenDirectoryDialog, showOpenFileDialog } from '../dialogs'
import {
  ADD_CUSTOM_LABWARE,
  ADD_CUSTOM_LABWARE_FILE,
  ADD_LABWARE,
  CHANGE_CUSTOM_LABWARE_DIRECTORY,
  CHANGE_DIRECTORY,
  DELETE_CUSTOM_LABWARE_FILE,
  DELETE_LABWARE,
  FETCH_CUSTOM_LABWARE,
  INITIAL,
  LABWARE_DIRECTORY_CONFIG_PATH,
  OPEN_CUSTOM_LABWARE_DIRECTORY,
  OVERWRITE_LABWARE,
  POLL,
  UI_INITIALIZED,
  VALID_LABWARE_FILE,
} from '../constants'
import * as Definitions from './definitions'
import { validateLabwareFiles, validateNewLabwareFile } from './validation'
import { sameIdentity } from './compare'

import type {
  UncheckedLabwareFile,
  DuplicateLabwareFile,
  CheckedLabwareFile,
  CustomLabwareListActionSource as ListSource,
} from '@opentrons/app/src/redux/custom-labware/types'

import type { BrowserWindow } from 'electron'
import type { Action, Dispatch } from '../types'
import {
  addCustomLabwareFailure,
  addNewLabwareName,
  customLabwareList,
  customLabwareListFailure,
  updateConfigValue,
} from '../config/actions'

const ensureDir: (dir: string) => Promise<void> = fse.ensureDir

const fetchCustomLabware = (): Promise<UncheckedLabwareFile[]> => {
  const { labware: config } = getFullConfig()

  return ensureDir(config.directory)
    .then(() => Definitions.readLabwareDirectory(config.directory))
    .then(Definitions.parseLabwareFiles)
}

const fetchValidatedCustomLabware = (): Promise<CheckedLabwareFile[]> => {
  return fetchCustomLabware().then(validateLabwareFiles)
}

const fetchAndValidateCustomLabware = (
  dispatch: Dispatch,
  source: ListSource
): Promise<void> => {
  return fetchValidatedCustomLabware()
    .then(payload => {
      dispatch(customLabwareList(payload, source))
    })
    .catch((error: Error) => {
      dispatch(customLabwareListFailure(error.message, source))
    })
}

const overwriteLabware = (
  dispatch: Dispatch,
  next: DuplicateLabwareFile
): Promise<void> => {
  return fetchCustomLabware()
    .then(files => {
      const existing = validateLabwareFiles(files)
      const duplicates = existing.filter(e => sameIdentity(next, e))
      const removals = duplicates.map(d =>
        Definitions.removeLabwareFile(d.filename)
      )

      return Promise.all(removals)
    })
    .then(() => {
      const dir = getFullConfig().labware.directory
      return Definitions.addLabwareFile(next.filename, dir)
    })
    .then(() => fetchAndValidateCustomLabware(dispatch, OVERWRITE_LABWARE))
}

const copyLabware = (
  dispatch: Dispatch,
  filePaths: string[]
): Promise<void> => {
  return Promise.all([
    fetchCustomLabware(),
    Definitions.parseLabwareFiles(filePaths),
  ]).then(([existingFiles, [newFile]]) => {
    const existing = validateLabwareFiles(existingFiles)
    const next = validateNewLabwareFile(existing, newFile)
    const dir = getFullConfig().labware.directory

    if (next.type !== VALID_LABWARE_FILE) {
      return dispatch(addCustomLabwareFailure(next))
    }
    return Definitions.addLabwareFile(next.filename, dir)
      .then(() => fetchAndValidateCustomLabware(dispatch, ADD_LABWARE))
      .then(() => dispatch(addNewLabwareName(newFile.filename)))
  })
}

const deleteLabware = (dispatch: Dispatch, filePath: string): Promise<void> => {
  return Definitions.removeLabwareFile(filePath).then(() =>
    fetchAndValidateCustomLabware(dispatch, DELETE_LABWARE)
  )
}

export function getValidLabwareFilePaths(): Promise<string[]> {
  return fetchValidatedCustomLabware().then(validatedLabware => {
    return validatedLabware
      .filter(labware => labware.type === VALID_LABWARE_FILE)
      .map(labware => labware.filename)
  })
}

export function registerLabware(
  dispatch: Dispatch,
  mainWindow: BrowserWindow
): Dispatch {
  handleConfigChange(LABWARE_DIRECTORY_CONFIG_PATH, () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchAndValidateCustomLabware(dispatch, CHANGE_DIRECTORY)
  })

  return function handleActionForLabware(action: Action) {
    switch (action.type) {
      case FETCH_CUSTOM_LABWARE:
      case UI_INITIALIZED: {
        const source = action.type === FETCH_CUSTOM_LABWARE ? POLL : INITIAL
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetchAndValidateCustomLabware(dispatch, source)
        break
      }

      case CHANGE_CUSTOM_LABWARE_DIRECTORY: {
        const { labware: config } = getFullConfig()
        const dialogOptions = { defaultPath: config.directory }

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        showOpenDirectoryDialog(mainWindow, dialogOptions).then(filePaths => {
          if (filePaths.length > 0) {
            const dir = filePaths[0]
            dispatch(updateConfigValue('labware.directory', dir))
          }
        })
        break
      }

      case ADD_CUSTOM_LABWARE: {
        let addLabwareTask

        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if ((action.payload as { overwrite: DuplicateLabwareFile }).overwrite) {
          addLabwareTask = overwriteLabware(
            dispatch,
            (action.payload as { overwrite: DuplicateLabwareFile }).overwrite
          )
        } else {
          const dialogOptions = {
            defaultPath: app.getPath('downloads'),
            filters: [
              { name: 'JSON Labware Definitions', extensions: ['json'] },
            ],
            properties: ['multiSelections' as const],
          }

          addLabwareTask = showOpenFileDialog(mainWindow, dialogOptions).then(
            filePaths => {
              if (filePaths.length > 0) {
                return copyLabware(dispatch, filePaths)
              }
            }
          )
        }

        addLabwareTask.catch((error: Error) => {
          dispatch(addCustomLabwareFailure(null, error.message))
        })

        break
      }

      case ADD_CUSTOM_LABWARE_FILE: {
        const filePath = action.payload.filePath
        copyLabware(dispatch, [filePath]).catch((error: Error) => {
          dispatch(addCustomLabwareFailure(null, error.message))
        })
        break
      }

      case DELETE_CUSTOM_LABWARE_FILE: {
        const filePath = action.payload.filePath
        deleteLabware(dispatch, filePath).catch((error: Error) => {
          console.error(error)
        })
        break
      }

      case OPEN_CUSTOM_LABWARE_DIRECTORY: {
        const dir = getFullConfig().labware.directory
        shell.openPath(dir)
        break
      }
    }
  }
}
