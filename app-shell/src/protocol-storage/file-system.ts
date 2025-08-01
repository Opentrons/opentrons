import path from 'path'
import { app, shell } from 'electron'
import fs from 'fs-extra'
import uuid from 'uuid/v4'

import { analyzeProtocolSource } from '../protocol-analysis'

import type { Dirent } from 'fs'
import type { StoredProtocolDir } from '@opentrons/app/src/redux/protocol-storage'

/**
 * Module for managing local protocol files on the host filesystem
 *
 * example directory structure:
 * protocols/
 * ├─ abc123-uuid/
 * │  ├─ src/
 * │  │  ├─ serialDilution.py
 * │  ├─ analysis/
 * │  │  ├─ 1646303907.json
 * ├─ def456-uuid/
 * │  ├─ src/
 * │  │  ├─ swiftTurbo.json
 * │  ├─ analysis/
 * │  │  ├─ 1646303906.json
 */
export const PRE_V7_PARITY_DIRECTORY_PATH = path.join(
  app.getPath('userData'),
  'protocols_v7.0-supported'
)
export const PROTOCOLS_DIRECTORY_NAME = 'protocols'
export const PROTOCOLS_DIRECTORY_PATH = path.join(
  app.getPath('userData'),
  PROTOCOLS_DIRECTORY_NAME
)
export const PROTOCOL_SRC_DIRECTORY_NAME = 'src'
export const PROTOCOL_ANALYSIS_DIRECTORY_NAME = 'analysis'

function makeAnalysisFilePath(analysisDirPath: string): string {
  return path.join(analysisDirPath, `${new Date().getTime()}.json`)
}

export function readDirectoriesWithinDirectory(dir: string): Promise<string[]> {
  const getAbsolutePath = (e: Dirent): string => path.join(dir, e.name)

  return fs.readdir(dir, { withFileTypes: true }).then((entries: Dirent[]) => {
    const protocolDirPaths = entries
      .filter(e => e.isDirectory())
      .map(getAbsolutePath)

    return protocolDirPaths
  })
}

export function readFilesWithinDirectory(dir: string): Promise<string[]> {
  const getAbsolutePath = (e: Dirent): string => path.join(dir, e.name)

  return fs.readdir(dir, { withFileTypes: true }).then((entries: Dirent[]) => {
    const protocolDirPaths = entries
      .filter(e => e.isFile())
      .map(getAbsolutePath)

    return protocolDirPaths
  })
}

// FIX: Added the 'export' keyword to make this function available for import
export function preParityMigrateProtocolsFrom(
  src: string,
  dest: string
): () => Promise<void> {
  let hasCheckedForMigration = false

  return function (): Promise<void> {
    return new Promise((resolve, reject) => {
      if (hasCheckedForMigration) resolve()
      hasCheckedForMigration = true

      fs
        .stat(src)
        .then(doesSrcExist => {
          if (!doesSrcExist.isDirectory()) resolve()

          console.log(
            `Performing protocol migration to ${PROTOCOLS_DIRECTORY_NAME}...`
          )

          return migrateProtocols(src, dest).then(() => {
            console.log('Protocol migration complete.')
            resolve()
          })
        })
        .catch(e => {
          console.log(
            `Error migrating protocols to ${PROTOCOLS_DIRECTORY_NAME}: ${e}`
          )
          resolve()
        })
    })
  }

  function migrateProtocols(src: string, dest: string): Promise<void> {
    return fs
      .readdir(src)
      .then(items => {
        const protocols = items.map(item => {
          const srcItem = path.join(src, item)
          const destItem = path.join(dest, item)

          return fs.copy(srcItem, destItem, {
            overwrite: false,
          })
        })
        // Delete the tmp directory.
        return Promise.all(protocols).then(() =>
          fs.rm(src, {
            recursive: true,
            force: true,
          })
        )
      })
      .catch(e => Promise.reject(e))
  }
}

export function parseProtocolDirs(
  dirPaths: string[]
): Promise<StoredProtocolDir[]> {
  const tasks = dirPaths.map(dirPath => {
    const getAbsolutePath = (e: Dirent): string => path.join(dirPath, e.name)
    const readTask = fs.readdir(dirPath, { withFileTypes: true })
    const statTask = fs.stat(dirPath)

    return Promise.all([readTask, statTask]).then(([data, stats]) => {
      const protocolSrcDirent = data.find(
        (dirent: Dirent) =>
          dirent.isDirectory() && dirent.name === PROTOCOL_SRC_DIRECTORY_NAME
      )
      const protocolAnalysisDirent = data.find(
        (dirent: Dirent) =>
          dirent.isDirectory() &&
          dirent.name === PROTOCOL_ANALYSIS_DIRECTORY_NAME
      )
      const srcFilePathsProm =
        protocolSrcDirent != null
          ? readFilesWithinDirectory(getAbsolutePath(protocolSrcDirent))
          : Promise.resolve([])
      const analysisFilePathsProm =
        protocolAnalysisDirent != null
          ? readFilesWithinDirectory(getAbsolutePath(protocolAnalysisDirent))
          : Promise.resolve([])
      return Promise.all([srcFilePathsProm, analysisFilePathsProm]).then(
        ([srcFilePaths, analysisFilePaths]) => ({
          dirPath,
          modified: stats.mtimeMs,
          srcFilePaths,
          analysisFilePaths,
        })
      )
    })
  })

  return Promise.all(tasks)
}

export function addProtocolFile(
  mainFileSourcePath: string,
  protocolsDirPath: string
): Promise<string> {
  const protocolKey = uuid()
  const protocolDirPath = path.join(protocolsDirPath, protocolKey as string)

  const srcDirPath = path.join(protocolDirPath, PROTOCOL_SRC_DIRECTORY_NAME)
  const analysisDirPath = path.join(
    protocolDirPath,
    PROTOCOL_ANALYSIS_DIRECTORY_NAME
  )

  const extname = path.extname(mainFileSourcePath)
  const basename = path.basename(mainFileSourcePath, extname)
  const mainFileDestPath = path.join(srcDirPath, `${basename}${extname}`)

  return fs
    .mkdir(protocolDirPath)
    .then(() => fs.mkdir(srcDirPath))
    .then(() => fs.mkdir(analysisDirPath))
    .then(() => fs.copy(mainFileSourcePath, mainFileDestPath))
    .then(() => protocolKey)
}

export function removeProtocolByKey(
  protocolKey: string,
  protocolsDirPath: string
): Promise<void> {
  const targetDirPath = path.join(protocolsDirPath, protocolKey)
  return shell.trashItem(targetDirPath).catch(() =>
    fs
      .readdir(targetDirPath)
      .then(files => {
        return Promise.all(
          files.map(element => {
            fs.unlink(path.join(targetDirPath, element))
          })
        )
      })
      .then(() => fs.rmdir(targetDirPath))
  )
}

export function analyzeProtocolByKey(
  protocolKey: string,
  protocolsDirPath: string
): Promise<void> {
  const protocolDirPath = path.join(protocolsDirPath, protocolKey)
  const srcDirPath = path.join(protocolDirPath, PROTOCOL_SRC_DIRECTORY_NAME)
  const analysisDirPath = path.join(
    protocolDirPath,
    PROTOCOL_ANALYSIS_DIRECTORY_NAME
  )
  const destFilePath = makeAnalysisFilePath(analysisDirPath)
  return analyzeProtocolSource(srcDirPath, destFilePath)
}

export function viewProtocolSourceFolder(
  protocolKey: string,
  protocolsDirPath: string
): void {
  const protocolDirPath = path.join(protocolsDirPath, protocolKey)
  const srcDirPath = path.join(protocolDirPath, PROTOCOL_SRC_DIRECTORY_NAME)
  shell.openPath(srcDirPath)
}