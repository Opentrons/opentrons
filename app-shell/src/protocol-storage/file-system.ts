import path from 'path'
import fs from 'fs-extra'

import { app, shell } from 'electron'

import type { Dirent } from 'fs'
import type { UncheckedLabwareFile } from '@opentrons/app/src/redux/custom-labware/types'

export const PROTOCOL_DIRECTORY_NAME = 'protocols'
export const PROTOCOL_DIRECTORY_PATH = path.join(
  app.getPath('appData'),
  PROTOCOL_DIRECTORY_NAME
)

const RE_JSON_EXT = /\.json$/i

export function readProtocolDirectory(dir: string): Promise<string[]> {
  const absoluteName = (e: Dirent): string => path.join(dir, e.name)

  return fs.readdir(dir, { withFileTypes: true }).then((entries: Dirent[]) => {
    const protocolFiles = entries.filter(e => e.isDirectory()).map(absoluteName)

    return protocolFiles
  })
}

export function parseProtocolFiles(
  files: string[]
): Promise<UncheckedLabwareFile[]> {
  const tasks = files.map(f => {
    const readTask = fs.readJson(f, { throws: false })
    const statTask = fs.stat(f)

    return Promise.all([readTask, statTask]).then(([data, stats]) => ({
      filename: f,
      modified: stats.mtimeMs,
      data,
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

export function addProtocolFile(file: string): Promise<void> {
  const extname = path.extname(file)
  const basename = path.basename(file, extname)

  return getFileName(basename, extname).then(destName =>
    fs.readJson(file).then(data => fs.outputJson(destName, data))
  )
}

export function removeProtocolFile(file: string): Promise<void> {
  return shell.trashItem(file).catch(() => fs.unlink(file))
}
