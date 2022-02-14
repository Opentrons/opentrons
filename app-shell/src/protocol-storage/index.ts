import fse from 'fs-extra'
import { app, shell } from 'electron'
import { showOpenFileDialog } from '../dialogs'

import { UI_INITIALIZED } from '@opentrons/app/src/redux/shell/actions'
import * as ProtocolStorage from '@opentrons/app/src/redux/protocol-storage'

import * as FileSystem from './file-system'
import { validateProtocolFiles } from './validation'

import type {
  UncheckedProtocolFile,
  DuplicateProtocolFile,
  ProtocolListActionSource as ListSource,
} from '@opentrons/app/src/redux/protocol-storage/types'

import type { BrowserWindow } from 'electron'
import type { Action, Dispatch } from '../types'

const ensureDir: (dir: string) => Promise<void> = fse.ensureDir

const fetchProtocols = (): Promise<UncheckedProtocolFile[]> => {
  return ensureDir(FileSystem.PROTOCOL_DIRECTORY_PATH)
    .then(() => FileSystem.readProtocolDirectory())
    .then(FileSystem.parseProtocolFiles)
}

const fetchAndValidateProtocols = (
  dispatch: Dispatch,
  source: ListSource
): Promise<void> => {
  return fetchProtocols()
    .then(files => {
      const payload = validateProtocolFiles(files)
      dispatch(ProtocolStorage.protocolList(payload, source))
    })
    .catch((error: Error) => {
      dispatch(ProtocolStorage.protocolListFailure(error.message, source))
    })
}

const overwriteProtocol = (
  dispatch: Dispatch,
  next: DuplicateProtocolFile
): Promise<void> => {
  return fetchProtocols()
    .then(files => {
      return validateProtocolFiles(files)
    })
    .then(() => {
      return FileSystem.addProtocolFile(next.filename)
    })
    .then(() =>
      fetchAndValidateProtocols(dispatch, ProtocolStorage.OVERWRITE_PROTOCOL)
    )
}

const copyLabware = (
  dispatch: Dispatch,
  filePaths: string[]
): Promise<void> => {
  return Promise.all([
    fetchProtocols(),
    FileSystem.parseProtocolFiles(filePaths),
  ]).then(([_existingFiles, [newFile]]) => {
    const [next] = validateProtocolFiles([newFile])

    if (next.type !== ProtocolStorage.VALID_LABWARE_FILE) {
      return dispatch(ProtocolStorage.addProtocolFailure(next))
    }

    return FileSystem.addProtocolFile(next.filename).then(() =>
      fetchAndValidateProtocols(dispatch, ProtocolStorage.PROTOCOL_ADDITION)
    )
  })
}

export function registerProtocolStorage(
  dispatch: Dispatch,
  mainWindow: BrowserWindow
): Dispatch {
  return function handleActionForProtocolStorage(action: Action) {
    switch (action.type) {
      case ProtocolStorage.FETCH_PROTOCOL:
      case UI_INITIALIZED: {
        const source =
          action.type === ProtocolStorage.FETCH_PROTOCOL
            ? ProtocolStorage.POLL
            : ProtocolStorage.INITIAL
        fetchAndValidateProtocols(dispatch, source)
        break
      }

      case ProtocolStorage.ADD_PROTOCOL: {
        let addLabwareTask

        if (action.payload?.overwrite != null) {
          addLabwareTask = overwriteProtocol(
            dispatch,
            (action.payload as { overwrite: DuplicateProtocolFile }).overwrite
          )
        } else {
          const dialogOptions = {
            defaultPath: app.getPath('downloads'),
            filters: [
              { name: 'JSON Labware Definitions', extensions: ['json'] },
            ],
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
          dispatch(ProtocolStorage.addProtocolFailure(null, error.message))
        })

        break
      }

      case ProtocolStorage.OPEN_PROTOCOL_DIRECTORY: {
        shell.openPath(FileSystem.PROTOCOL_DIRECTORY_PATH)
        break
      }
    }
  }
}
