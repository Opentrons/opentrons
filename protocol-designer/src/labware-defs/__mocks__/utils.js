// @flow
// replace webpack-specific require.context with Node-based glob in tests
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { LabwareDefByDefId } from '../types'
import path from 'path'
import glob from 'glob'

const LABWARE_FIXTURE_PATTERN = path.join(
  __dirname,
  '../../../../shared-data/js/__tests__/fixtures/*.json'
)

const allLabware = glob
  .sync(LABWARE_FIXTURE_PATTERN)
  .map(require)
  .filter(d => d.metadata.displayCategory !== 'trash')

export const getAllDefinitions = jest.fn<Array<void>, LabwareDefByDefId>(
  () => allLabware
)

export const _getSharedLabware = jest.fn<Array<string>, ?LabwareDefinition2>(
  () => null
)
