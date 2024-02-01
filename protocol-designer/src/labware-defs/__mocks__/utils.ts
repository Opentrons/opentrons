// replace webpack-specific require.context with Node-based glob in tests
import assert from 'assert'
import { LabwareDefinition1, getLabwareDefURI } from '@opentrons/shared-data'
import { LabwareDefByDefURI } from '../types'
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
export const getAllDefinitions = jest.fn(() => allLabware)

export const _getSharedLabware = jest.fn(() => null)

export const getOnlyLatestDefs = jest.fn(() => allLabware)

const LEGACY_LABWARE_FIXTURE_PATTERN = path.join(
  __dirname,
  '../../../../shared-data/labware/fixtures/1/*.json'
)
const legacyLabwareDefs: LabwareDefinition1[] = glob
  .sync(LEGACY_LABWARE_FIXTURE_PATTERN)
  .map(require)

export const getLegacyLabwareDef = jest.fn(() => {
  return legacyLabwareDefs[0]
})
