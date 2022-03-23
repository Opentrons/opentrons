import path from 'path'
// replace webpack-specific require.context with Node-based glob in tests
import glob from 'glob'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

// require all definitions in the labware/definitions/2 directory
// require.context is webpack-specific method
const DEFS_FIXTURE_PATTERN = path.join(
  __dirname,
  '@opentrons/shared-data/labware/fixtures/2/*.json'
)

const allDefs: unknown[] = glob.sync(DEFS_FIXTURE_PATTERN).map(require)

export const getAllDefs = jest.fn(() =>
  (allDefs as LabwareDefinition2[]).reduce(
    (acc, def: LabwareDefinition2): Record<string, LabwareDefinition2> => ({
      ...acc,
      [def.namespace]: def,
    }),
    {}
  )
)
