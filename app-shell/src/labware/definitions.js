// @flow
import path from 'path'
import fs from 'fs-extra'

import type { Dirent } from '../types'
import type { UncheckedLabwareFile } from '@opentrons/app/src/custom-labware/types'

export function readLabwareDirectory(dir: string): Promise<Array<string>> {
  const absoluteName = e => path.join(dir, e.name)

  return fs
    .readdir(dir, { withFileTypes: true })
    .then((entries: Array<Dirent>) => {
      const jsonFiles = entries
        .filter(e => e.isFile() && e.name.endsWith('.json'))
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
