// @flow
// replace webpack-specific require.context with Node-based glob in tests
import {
  type LabwareDefinition2,
  getLabwareDefURI,
} from '@opentrons/shared-data'
import assert from 'assert'
import glob from 'glob'
import path from 'path'

import type { LabwareDefByDefURI } from '../types'

const LABWARE_FIXTURE_PATTERN = path.join(
  __dirname,
  '../../../../shared-data/labware/fixtures/2/*.json'
)

const allLabware: LabwareDefByDefURI = glob
  .sync(LABWARE_FIXTURE_PATTERN)
  .map(require)
  .filter(d => d.metadata.displayCategory !== 'trash')
  .reduce((acc, d) => ({ ...acc, [getLabwareDefURI(d)]: d }), {})

assert(
  Object.keys(allLabware).length > 0,
  `no labware fixtures found, is the path correct? ${LABWARE_FIXTURE_PATTERN}`
)

export const getAllDefinitions: JestMockFn<[], LabwareDefByDefURI> = jest.fn(
  () => allLabware
)

export const _getSharedLabware: JestMockFn<
  [string],
  ?LabwareDefinition2
> = jest.fn(() => null)

export const getOnlyLatestDefs: JestMockFn<[], empty> = jest.fn(() => {
  throw Error('getOnlyLatestDefs should not be used directly')
})
