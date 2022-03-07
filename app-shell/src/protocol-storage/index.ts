import fse from 'fs-extra'
import { shell } from 'electron'

import { UI_INITIALIZED } from '@opentrons/app/src/redux/shell/actions'
import * as ProtocolStorage from '@opentrons/app/src/redux/protocol-storage'

import * as FileSystem from './file-system'

import type { ProtocolListActionSource as ListSource } from '@opentrons/app/src/redux/protocol-storage/types'

import type { Action, Dispatch } from '../types'
import { createLogger } from '@opentrons/app/src/logger'

const ensureDir: (dir: string) => Promise<void> = fse.ensureDir

const log = createLogger('discovery')

const fetchProtocols = (
  dispatch: Dispatch,
  source: ListSource
): Promise<void> => {
  return ensureDir(FileSystem.PROTOCOLS_DIRECTORY_PATH)
    .then(() =>
      FileSystem.readDirectoriesWithinDirectory(
        FileSystem.PROTOCOLS_DIRECTORY_PATH
      )
    )
    .then(FileSystem.parseProtocolDirs)
    .then(storedProtocols => {
      log.info('\n\n PROTOCOL: ', FileSystem.PROTOCOLS_DIRECTORY_PATH)
      log.info('\n\n files: ', storedProtocols)
      dispatch(ProtocolStorage.updateProtocolList(storedProtocols, source))
    })
    .catch((error: Error) => {
      dispatch(ProtocolStorage.updateProtocolListFailure(error.message, source))
    })
}

export function registerProtocolStorage(dispatch: Dispatch): Dispatch {
  return function handleActionForProtocolStorage(action: Action) {
    switch (action.type) {
      case ProtocolStorage.FETCH_PROTOCOLS:
      case UI_INITIALIZED: {
        const source =
          action.type === ProtocolStorage.FETCH_PROTOCOLS
            ? ProtocolStorage.POLL
            : ProtocolStorage.INITIAL
        fetchProtocols(dispatch, source)
        break
      }

      case ProtocolStorage.ADD_PROTOCOL: {
        FileSystem.addProtocolFile(
          action.payload.protocolFile.path,
          FileSystem.PROTOCOLS_DIRECTORY_PATH
        )

        break
      }

      case ProtocolStorage.OPEN_PROTOCOL_DIRECTORY: {
        shell.openPath(FileSystem.PROTOCOLS_DIRECTORY_PATH)
        break
      }
    }
  }
}
