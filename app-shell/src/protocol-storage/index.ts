
import path from 'path'
import { shell } from 'electron'
import fse from 'fs-extra'
import {
  analyzeProtocol,
  analyzeProtocolFailure,
  analyzeProtocolSuccess,
  fetchProtocols as refetchProtocols,
  updateProtocolList,
  updateProtocolListFailure,
  LOCK_PROTOCOL,
  UNLOCK_PROTOCOL,
  VERIFY_PROTOCOL_PASSWORD,
} from '../config/actions'
import {
  ADD_PROTOCOL,
  ANALYZE_PROTOCOL,
  FETCH_PROTOCOLS,
  INITIAL,
  OPEN_PROTOCOL_DIRECTORY,
  POLL,
  PROTOCOL_ADDITION,
  REMOVE_PROTOCOL,
  UI_INITIALIZED,
  VIEW_PROTOCOL_SOURCE_FOLDER,
} from '../constants'
import { createFailedAnalysis } from '../protocol-analysis/writeFailedAnalysis'
import * as FileSystem from './file-system'
// NOTE: These DB functions must be created in a new file, e.g., './db.ts'
import {
  getProtocolLockStatuses,
  lockProtocolInDb,
  unlockProtocolInDb,
  verifyPasswordInDb,
} from './db'

import type { StoredProtocolData } from '@opentrons/app/src/redux/protocol-storage'
import type { ProtocolListActionSource as ListSource } from '@opentrons/app/src/redux/protocol-storage/types'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { Action, Dispatch } from '../types'

const ensureDir: (dir: string) => Promise<void> = fse.ensureDir

export const getUnixTimeFromAnalysisPath = (analysisPath: string): number =>
  Number(path.basename(analysisPath, path.extname(analysisPath)))

export const getParsedAnalysisFromPath = (
  analysisPath: string
): ProtocolAnalysisOutput | undefined => {
  try {
    return fse.readJsonSync(analysisPath)
  } catch (error) {
    const errorMessage =
      error instanceof Error && error?.message != null
        ? error.message
        : 'protocol analysis file cannot be parsed'
    return createFailedAnalysis(errorMessage)
  }
}

// This function has been restored to its original, correct implementation.
const migrateProtocolsFromTempDirectory = FileSystem.preParityMigrateProtocolsFrom(
  FileSystem.PRE_V7_PARITY_DIRECTORY_PATH,
  FileSystem.PROTOCOLS_DIRECTORY_PATH
)

// This function has been rewritten with async/await for clarity and correctness.
export const fetchProtocols = async (
  dispatch: Dispatch,
  source: ListSource
): Promise<void> => {
  try {
    const lockStatuses = await getProtocolLockStatuses()
    await ensureDir(FileSystem.PROTOCOLS_DIRECTORY_PATH)
    await migrateProtocolsFromTempDirectory()

    const protocolDirs = await FileSystem.readDirectoriesWithinDirectory(
      FileSystem.PROTOCOLS_DIRECTORY_PATH
    )
    const storedProtocols = await FileSystem.parseProtocolDirs(protocolDirs)

    const storedProtocolsData = storedProtocols.map(storedProtocolDir => {
      const protocolKey = path.parse(storedProtocolDir.dirPath).base
      const mostRecentAnalysisFilePath =
        storedProtocolDir.analysisFilePaths.reduce<string | null>(
          (acc, analysisFilePath) => {
            if (acc === null) return analysisFilePath
            return getUnixTimeFromAnalysisPath(analysisFilePath) >
              getUnixTimeFromAnalysisPath(acc)
              ? analysisFilePath
              : acc
          },
          null
        )
      const mostRecentAnalysis =
        mostRecentAnalysisFilePath != null
          ? getParsedAnalysisFromPath(mostRecentAnalysisFilePath) ?? null
          : null

      return {
        protocolKey,
        isLocked: lockStatuses[protocolKey] ?? false,
        modified: storedProtocolDir.modified,
        srcFileNames: storedProtocolDir.srcFilePaths.map(
          filePath => path.parse(filePath).base
        ),
        srcFiles: storedProtocolDir.srcFilePaths.map(srcFilePath => {
          const buffer = fse.readFileSync(srcFilePath)
          return buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength
          )
        }),
        mostRecentAnalysis,
      }
    })
    dispatch(updateProtocolList(storedProtocolsData, source))
  } catch (error: any) {
    dispatch(updateProtocolListFailure(error?.message ?? 'Unknown error', source))
  }
}

// This function has been restored to its original structure with the new cases added cleanly.
export function registerProtocolStorage(dispatch: Dispatch): (action: Action) => void {
  return function handleActionForProtocolStorage(action: Action) {
    switch (action.type) {
      case FETCH_PROTOCOLS:
      case UI_INITIALIZED: {
        const source = action.type === FETCH_PROTOCOLS ? POLL : INITIAL
        void fetchProtocols(dispatch, source)
        break
      }
      case ADD_PROTOCOL: {
        FileSystem.addProtocolFile(
          action.payload.protocolFilePath,
          FileSystem.PROTOCOLS_DIRECTORY_PATH
        ).then(protocolKey => {
          void fetchProtocols(dispatch, PROTOCOL_ADDITION)
          dispatch(analyzeProtocol(protocolKey))
        })
        break
      }
      case ANALYZE_PROTOCOL: {
        FileSystem.analyzeProtocolByKey(
          action.payload.protocolKey,
          FileSystem.PROTOCOLS_DIRECTORY_PATH
        )
          .then(() => {
            dispatch(analyzeProtocolSuccess(action.payload.protocolKey))
            return fetchProtocols(dispatch, PROTOCOL_ADDITION)
          })
          .catch((e: Error) => {
            console.error('Error analyzing protocol', e)
            dispatch(analyzeProtocolFailure(action.payload.protocolKey))
          })
        break
      }
      case REMOVE_PROTOCOL: {
        FileSystem.removeProtocolByKey(
          action.payload.protocolKey,
          FileSystem.PROTOCOLS_DIRECTORY_PATH
        ).then(() => fetchProtocols(dispatch, PROTOCOL_ADDITION))
        break
      }
      case VIEW_PROTOCOL_SOURCE_FOLDER: {
        FileSystem.viewProtocolSourceFolder(
          action.payload.protocolKey,
          FileSystem.PROTOCOLS_DIRECTORY_PATH
        )
        break
      }
      case OPEN_PROTOCOL_DIRECTORY: {
        void shell.openPath(FileSystem.PROTOCOLS_DIRECTORY_PATH)
        break
      }
      case LOCK_PROTOCOL: {
        const { protocolKey, password } = action.payload
        if (password != null) {
          lockProtocolInDb(protocolKey, password).then(() => {
            void fetchProtocols(dispatch, PROTOCOL_ADDITION)
          })
        }
        break
      }
      case UNLOCK_PROTOCOL: {
        const { protocolKey, password } = action.payload
        if (password != null) {
          unlockProtocolInDb(protocolKey, password).then(() => {
            void fetchProtocols(dispatch, PROTOCOL_ADDITION)
          })
        }
        break
      }
      case VERIFY_PROTOCOL_PASSWORD: {
        const { protocolKey, password } = action.payload
        if (password != null) {
          verifyPasswordInDb(protocolKey, password).then((isValid: boolean) => {
            console.log(
              `Password verification for ${protocolKey}: ${
                isValid ? 'SUCCESS' : 'FAILURE'
              }`
            )
          })
        }
        break
      }
    }
  }
}
