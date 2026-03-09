import path from 'path'
import { shell } from 'electron'
import fse from 'fs-extra'

import { getConfig } from '../config'
import {
  analyzeProtocol,
  analyzeProtocolFailure,
  analyzeProtocolSuccess,
  updateProtocolList,
  updateProtocolListFailure,
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

import type { ProtocolListActionSource as ListSource } from '@opentrons/app/src/redux/protocol-storage/types'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { Action, Dispatch } from '../types'

const ensureDir: (dir: string) => Promise<void> = fse.ensureDir

function getIgnoreOT2App(): boolean {
  const devInternal = getConfig('devInternal') ?? {}
  return devInternal.ignoreOT2App ?? false
}

let protocolsDirectoryPath: string | null = null

// Returns the protocols directory path. Set once at initialization based on
// `ignoreOT2App` feature flag. Does not change during app lifecycle.
function getProtocolsDirectoryPath(): string {
  if (protocolsDirectoryPath == null) {
    protocolsDirectoryPath = getIgnoreOT2App()
      ? FileSystem.FLEX_PROTOCOLS_DIRECTORY_PATH
      : FileSystem.PROTOCOLS_DIRECTORY_PATH
  }

  return protocolsDirectoryPath
}

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

// Revert a v7.0.0 pre-parity stop-gap solution.
const migrateProtocolsFromTempDirectory = preParityMigrateProtocolsFrom(
  FileSystem.PRE_V7_PARITY_DIRECTORY_PATH,
  FileSystem.PROTOCOLS_DIRECTORY_PATH
)
export function preParityMigrateProtocolsFrom(
  src: string,
  dest: string
): () => Promise<void> {
  let hasCheckedForMigration = false

  return function (): Promise<void> {
    return new Promise((resolve, reject) => {
      if (hasCheckedForMigration) resolve()
      hasCheckedForMigration = true

      fse
        .stat(src)
        .then(doesSrcExist => {
          if (!doesSrcExist.isDirectory()) resolve()

          console.log(
            `Performing protocol migration to ${FileSystem.PROTOCOLS_DIRECTORY_NAME}...`
          )

          return migrateProtocols(src, dest).then(() => {
            console.log('Protocol migration complete.')
            resolve()
          })
        })
        .catch(e => {
          console.log(
            `Error migrating protocols to ${FileSystem.PROTOCOLS_DIRECTORY_NAME}: ${e}`
          )
          resolve()
        })
    })
  }

  function migrateProtocols(src: string, dest: string): Promise<void> {
    return fse
      .readdir(src)
      .then(items => {
        const protocols = items.map(item => {
          const srcItem = path.join(src, item)
          const destItem = path.join(dest, item)

          return fse.copy(srcItem, destItem, {
            overwrite: false,
          })
        })
        // Delete the tmp directory.
        return Promise.all(protocols).then(() =>
          fse.rm(src, {
            recursive: true,
            force: true,
          })
        )
      })
      .catch(e => Promise.reject(e))
  }
}

// If ignoreOT2App is enabled and flex-protocols does not exist,
// copy only Flex protocols from protocols to flex-protocols.
async function migrateFlexProtocolsToFlexDirectory(): Promise<void> {
  if (!getIgnoreOT2App()) {
    return
  }

  try {
    const destStat = await fse.stat(FileSystem.FLEX_PROTOCOLS_DIRECTORY_PATH)
    if (destStat.isDirectory()) {
      return
    }
  } catch {
    // flex-protocols doesn't exist, proceed with migration
  }

  try {
    await ensureDir(FileSystem.FLEX_PROTOCOLS_DIRECTORY_PATH)
    const protocolDirPaths = await FileSystem.readDirectoriesWithinDirectory(
      FileSystem.PROTOCOLS_DIRECTORY_PATH
    )

    for (const dirPath of protocolDirPaths) {
      const isFlex = await FileSystem.isFlexProtocol(dirPath)
      if (isFlex) {
        const protocolKey = path.parse(dirPath).base
        const destPath = path.join(
          FileSystem.FLEX_PROTOCOLS_DIRECTORY_PATH,
          protocolKey
        )
        await fse.copy(dirPath, destPath, { overwrite: false })
      }
    }
    console.log(
      `Flex protocol migration to ${FileSystem.FLEX_PROTOCOLS_DIRECTORY_NAME} complete.`
    )
  } catch (e) {
    console.log(
      `Error migrating Flex protocols to ${FileSystem.FLEX_PROTOCOLS_DIRECTORY_NAME}: ${e}`
    )
  }
}

function storedProtocolDirToProtocolData(storedProtocolDir: {
  dirPath: string
  modified: number
  srcFilePaths: string[]
  analysisFilePaths: string[]
}): {
  protocolKey: string
  modified: number
  srcFileNames: string[]
  srcFiles: Buffer[]
  mostRecentAnalysis: ProtocolAnalysisOutput | null
} {
  const mostRecentAnalysisFilePath = storedProtocolDir.analysisFilePaths.reduce<
    string | null
  >((acc, analysisFilePath) => {
    if (acc !== null) {
      if (
        getUnixTimeFromAnalysisPath(analysisFilePath) >
        getUnixTimeFromAnalysisPath(acc)
      ) {
        return analysisFilePath
      }
      return acc
    }
    return analysisFilePath
  }, null)
  const mostRecentAnalysis =
    mostRecentAnalysisFilePath != null
      ? (getParsedAnalysisFromPath(mostRecentAnalysisFilePath) ?? null)
      : null

  return {
    protocolKey: path.parse(storedProtocolDir.dirPath).base,
    modified: storedProtocolDir.modified,
    srcFileNames: storedProtocolDir.srcFilePaths.map(
      filePath => path.parse(filePath).base
    ),
    srcFiles: storedProtocolDir.srcFilePaths.map(srcFilePath => {
      const buffer = fse.readFileSync(srcFilePath)
      return Buffer.from(buffer, buffer.byteOffset, buffer.byteLength)
    }),
    mostRecentAnalysis,
  }
}

export const fetchProtocols = (
  dispatch: Dispatch,
  source: ListSource
): Promise<void> => {
  return ensureDir(FileSystem.PROTOCOLS_DIRECTORY_PATH)
    .then(() => migrateProtocolsFromTempDirectory())
    .then(() => migrateFlexProtocolsToFlexDirectory())
    .then(() => {
      const protocolsDir = getProtocolsDirectoryPath()
      return FileSystem.readDirectoriesWithinDirectory(protocolsDir)
    })
    .then(FileSystem.parseProtocolDirs)
    .then(storedProtocols => {
      const protocolDataList = storedProtocols.map(
        storedProtocolDirToProtocolData
      )
      dispatch(updateProtocolList(protocolDataList, source))
    })
    .catch((error: Error) => {
      dispatch(updateProtocolListFailure(error.message, source))
    })
}

export function registerProtocolStorage(dispatch: Dispatch): Dispatch {
  return function handleActionForProtocolStorage(action: Action) {
    switch (action.type) {
      case FETCH_PROTOCOLS:
      case UI_INITIALIZED: {
        const source = action.type === FETCH_PROTOCOLS ? POLL : INITIAL
        void fetchProtocols(dispatch, source)
        break
      }

      case ADD_PROTOCOL: {
        const protocolsDir = getProtocolsDirectoryPath()
        void FileSystem.addProtocolFile(
          action.payload.protocolFilePath,
          protocolsDir
        ).then(protocolKey => {
          void fetchProtocols(dispatch, PROTOCOL_ADDITION)
          dispatch(analyzeProtocol(protocolKey))
        })
        break
      }

      case ANALYZE_PROTOCOL: {
        const protocolsDir = getProtocolsDirectoryPath()
        void FileSystem.analyzeProtocolByKey(
          action.payload.protocolKey,
          protocolsDir
        )
          .then(() => {
            dispatch(analyzeProtocolSuccess(action.payload.protocolKey))
            return fetchProtocols(dispatch, PROTOCOL_ADDITION)
          })
          .catch((_e: Error) => {
            dispatch(analyzeProtocolFailure(action.payload.protocolKey))
          })
        break
      }

      case REMOVE_PROTOCOL: {
        const protocolsDir = getProtocolsDirectoryPath()
        void FileSystem.removeProtocolByKey(
          action.payload.protocolKey,
          protocolsDir
        ).then(() => fetchProtocols(dispatch, PROTOCOL_ADDITION))
        break
      }

      case VIEW_PROTOCOL_SOURCE_FOLDER: {
        const protocolsDir = getProtocolsDirectoryPath()
        FileSystem.viewProtocolSourceFolder(
          action.payload.protocolKey,
          protocolsDir
        )
        break
      }

      case OPEN_PROTOCOL_DIRECTORY: {
        void shell.openPath(getProtocolsDirectoryPath())
        break
      }
    }
  }
}
