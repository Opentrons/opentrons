import path from 'path'
import fs from 'fs-extra'
import uuid from 'uuid/v4'

import { app, shell } from 'electron'

import type { StoredProtocolDir } from '@opentrons/app/src/redux/protocol-storage'
import type { Dirent } from 'fs'
import { analyzeProtocolSource } from '../protocol-analysis'
import { createProtocolEditorUi } from '../ui'

/**
 * Module for managing local protocol files on the host filesystem
 *
 * example directory structure:
 * protocols/
 *  ├─ abc123-uuid/
 *  │  ├─ src/
 *  │  │  ├─ serialDilution.py
 *  │  ├─ analysis/
 *  │  │  ├─ 1646303907.json
 *  ├─ def456-uuid/
 *  │  ├─ src/
 *  │  │  ├─ swiftTurbo.json
 *  │  ├─ analysis/
 *  │  │  ├─ 1646303906.json
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
  const protocolDirPath = path.join(protocolsDirPath, protocolKey)

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

export function editProtocol(
  protocolKey: string,
  protocolsDirPath: string
): void {
  const protocolDirPath = path.join(protocolsDirPath, protocolKey)
  const srcDirPath = path.join(protocolDirPath, PROTOCOL_SRC_DIRECTORY_NAME)
  createProtocolEditorUi()
}

