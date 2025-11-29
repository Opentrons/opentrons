// replace webpack-specific require.context with Node-based glob in tests

import path from 'path'
import glob from 'glob'
import { vi } from 'vitest'

import { getLabwareDefURI } from '@opentrons/shared-data'

import type { Mock } from 'vitest'
import type { LabwareDefinition1 } from '@opentrons/shared-data'
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
console.assert(
  Object.keys(allLabware).length > 0,
  `no labware fixtures found, is the path correct? ${LABWARE_FIXTURE_PATTERN}`
)
export const getAllDefinitions: Mock<() => LabwareDefByDefURI> = vi.fn(
  () => allLabware
)

export const _getSharedLabware: Mock<() => null> = vi.fn(() => null)

export const getOnlyLatestDefs: Mock<() => LabwareDefByDefURI> = vi.fn(
  () => allLabware
)

const LEGACY_LABWARE_FIXTURE_PATTERN = path.join(
  __dirname,
  '../../../../shared-data/labware/fixtures/1/*.json'
)
const legacyLabwareDefs: LabwareDefinition1[] = glob
  .sync(LEGACY_LABWARE_FIXTURE_PATTERN)
  .map(require)

export const getLegacyLabwareDef: Mock<() => LabwareDefinition1 | null> = vi.fn(
  () => {
    return legacyLabwareDefs[0]
  }
)
