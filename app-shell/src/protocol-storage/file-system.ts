import path from 'path'
import fs from 'fs-extra'
import uuid from 'uuid/v4'

import { app, shell } from 'electron'

import type { Dirent } from 'fs'
import type { UncheckedLabwareFile } from '@opentrons/app/src/redux/custom-labware/types'

export const PROTOCOL_DIRECTORY_NAME = 'protocols'
export const PROTOCOL_DIRECTORY_PATH = path.join(
  app.getPath('appData'),
  PROTOCOL_DIRECTORY_NAME
)

export function readProtocolsDirectory(dir: string): Promise<string[]> {
  const getAbsolutePath = (e: Dirent): string => path.join(dir, e.name)

  return fs.readdir(dir, { withFileTypes: true }).then((entries: Dirent[]) => {
    const protocolDirPaths = entries
      .filter(e => e.isDirectory())
      .map(getAbsolutePath)

    return protocolDirPaths
  })
}

interface UncheckedProtocolDir {
  dirPath: string
  modified: number
  data: string[]
}
export function parseProtocolDirs(
  dirPaths: string[]
): Promise<UncheckedProtocolDir[]> {
  const tasks = dirPaths.map(dirPath => {
    const getAbsolutePath = (e: Dirent): string => path.join(dirPath, e.name)
    const readTask = fs.readdir(dirPath, { withFileTypes: true })
    const statTask = fs.stat(dirPath)

    return Promise.all([readTask, statTask]).then(([data, stats]) => ({
      dirPath,
      modified: stats.mtimeMs,
      data: data.map((dirent: Dirent) => getAbsolutePath(dirent)),
    }))
  })

  return Promise.all(tasks)
}

const getFileName = (base: string, ext: string, count = 0): Promise<string> => {
  // TODO: appropriately grab python file name with fallback, also assign uuid
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  const basename = `${base}${count || ''}${ext}`
  const name = path.join(PROTOCOL_DIRECTORY_PATH, basename)

  return fs
    .pathExists(name)
    .then((exists: boolean) =>
      exists ? getFileName(base, ext, count + 1) : name
    )
}

export function addProtocolFile(
  file: string,
  protocolsDirPath: string
): Promise<void> {
  const protocolId = uuid()
  const dirPath = path.join(protocolsDirPath, protocolId)

  const extname = path.extname(file)
  const basename = path.basename(file, extname)
  return fs.mkdir(dirPath).then(() => {
    return fs.copy(file, path.join(dirPath, `${basename}${extname}`))
  })
}

export function removeProtocolById(
  protocolId: string,
  protocolsDirPath: string
): Promise<void> {
  const targetDirPath = path.join(protocolsDirPath, protocolId)
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
