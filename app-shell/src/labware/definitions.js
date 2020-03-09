// @flow
import path from 'path'
import fs from 'fs-extra'
import { shell } from 'electron'

import type { Dirent } from '../types'
import type { UncheckedLabwareFile } from '@opentrons/app/src/custom-labware/types'

const RE_JSON_EXT = /\.json$/i

export function readLabwareDirectory(dir: string): Promise<Array<string>> {
  const absoluteName = e => path.join(dir, e.name)

  return fs
    .readdir(dir, { withFileTypes: true })
    .then((entries: Array<Dirent>) => {
      const jsonFiles = entries
        .filter(e => e.isFile() && RE_JSON_EXT.test(e.name))
        .map(absoluteName)

      const getNestedFiles = Promise.all(
        entries
          .filter(e => e.isDirectory())
          .map(absoluteName)
          .map(readLabwareDirectory)
      )

      return getNestedFiles.then(nested => {
        // $FlowFixMe: https://github.com/facebook/flow/issues/7397
        const nestedFiles: Array<string> = nested.flat()
        return [...jsonFiles, ...nestedFiles]
      })
    })
}

export function parseLabwareFiles(
  files: Array<string>
): Promise<Array<UncheckedLabwareFile>> {
  const tasks = files.map(f => {
    const readTask = fs.readJson(f, { throws: false })
    const statTask = fs.stat(f)

    return Promise.all([readTask, statTask]).then(([data, stats]) => ({
      filename: f,
      created: stats.birthtimeMs,
      data,
    }))
  })

  return Promise.all(tasks)
}

// get a filename, adding an incrementor to avoid collisions
const getFileName = (
  dir: string,
  base: string,
  ext: string,
  count = 0
): Promise<string> => {
  const basename = `${base}${count || ''}${ext}`
  const name = path.join(dir, basename)

  return fs
    .pathExists(name)
    .then((exists: boolean) =>
      exists ? getFileName(dir, base, ext, count + 1) : name
    )
}

export function addLabwareFile(file: string, dir: string): Promise<void> {
  const extname = path.extname(file)
  const basename = path.basename(file, extname)

  return getFileName(dir, basename, extname).then(destName =>
    fs.readJson(file).then(data => fs.outputJson(destName, data))
  )
}

export function removeLabwareFile(file: string): Promise<void> {
  const result = shell.moveItemToTrash(file)

  return result ? Promise.resolve() : fs.unlink(file)
}
