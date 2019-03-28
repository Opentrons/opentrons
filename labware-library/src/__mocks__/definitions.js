// @flow
// replace webpack-specific require.context with Node-based glob in tests
import path from 'path'
import glob from 'glob'

import type {LabwareList} from '../types'

const allLabware = glob
  .sync(path.join(__dirname, '../../shared-data/definitions2/*.json'))
  .map(require)
  .filter(d => d.metadata.displayCategory !== 'trash')

export function getAllDefinitions (): LabwareList {
  return allLabware
}
