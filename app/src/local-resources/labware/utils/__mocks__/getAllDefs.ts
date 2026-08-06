import path from 'path'
// replace webpack-specific require.context with Node-based glob in tests
import glob from 'glob'
import { vi } from 'vitest'

import type { Mock } from 'vitest'
import type { LabwareDefinition } from '@opentrons/shared-data'

// require all definitions in the labware/definitions/2 directory
// require.context is webpack-specific method
const DEFS_FIXTURE_PATTERN = path.join(
  __dirname,
  '@opentrons/shared-data/labware/fixtures/2/*.json'
)

const allDefs: unknown[] = glob.sync(DEFS_FIXTURE_PATTERN).map(require)

export const getAllDefs: Mock<() => Record<string, LabwareDefinition>> = vi.fn(
  (): Record<string, LabwareDefinition> =>
    (allDefs as LabwareDefinition[]).reduce(
      (acc, def: LabwareDefinition): Record<string, LabwareDefinition> => ({
        ...acc,
        [def.namespace]: def,
      }),
      {}
    )
)
