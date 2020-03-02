// @flow
// replace webpack-specific require.context with Node-based glob in tests
import assert from 'assert'
import {
  getLabwareDefURI,
  type LabwareDefinition2,
} from '@opentrons/shared-data'
import type { LabwareDefByDefURI } from '../types'
import path from 'path'
import glob from 'glob'

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

export const getAllDefinitions = jest.fn<Array<void>, LabwareDefByDefURI>(
  () => allLabware
)

export const _getSharedLabware = jest.fn<Array<string>, ?LabwareDefinition2>(
  () => null
)

export const getOnlyLatestDefs = jest.fn<Array<void>, any>(() => {
  throw Error('getOnlyLatestDefs should not be used directly')
})
