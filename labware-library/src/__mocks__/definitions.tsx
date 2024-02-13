import assert from 'assert'
import { vi } from 'vitest'
// replace webpack-specific require.context with Node-based glob in tests
import path from 'path'
import glob from 'glob'
import uniq from 'lodash/uniq'

import type { Mock } from 'vitest'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const LABWARE_FIXTURE_PATTERN = path.join(
  __dirname,
  '../../../shared-data/labware/fixtures/2/*.json'
)

const allLoadNames = uniq(
  glob
    .sync(LABWARE_FIXTURE_PATTERN)
    .map(require)
    .map((def: any) => (def as LabwareDefinition2).parameters.loadName)
)

assert(
  allLoadNames.length > 0,
  `no labware loadNames found, something broke. ${LABWARE_FIXTURE_PATTERN}`
)

export const getAllLoadNames: Mock = vi.fn(() => allLoadNames)

const allDisplayNames = uniq(
  glob
    .sync(LABWARE_FIXTURE_PATTERN)
    .map(require)
    .map((def: any) => (def as LabwareDefinition2).metadata.displayName)
)

assert(
  allDisplayNames.length > 0,
  `no labware displayNames found, something broke. ${LABWARE_FIXTURE_PATTERN}`
)

export const getAllDisplayNames: Mock = vi.fn(() => allDisplayNames)

const allLabware = glob
  .sync(LABWARE_FIXTURE_PATTERN)
  .map(require)
  .filter(
    (d: any) => (d as LabwareDefinition2).metadata.displayCategory !== 'trash'
  )

assert(
  allLabware.length > 0,
  `no labware fixtures found, is the path correct? ${LABWARE_FIXTURE_PATTERN}`
)

export const getAllDefinitions: Mock = vi.fn(() => allLabware)
