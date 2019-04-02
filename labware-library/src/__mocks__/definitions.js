// @flow
// replace webpack-specific require.context with Node-based glob in tests
import path from 'path'
import glob from 'glob'

import type {LabwareList} from '../types'

const LABWARE_FIXTURE_PATTERN = path.join(
  __dirname,
  '../../../shared-data/js/__tests__/fixtures/*.json'
)

const allLabware = glob
  .sync(LABWARE_FIXTURE_PATTERN)
  .map(require)
  .filter(d => d.metadata.displayCategory !== 'trash')

export function getAllDefinitions (): LabwareList {
  return allLabware
}
