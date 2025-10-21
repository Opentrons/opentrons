import { getAllDefinitions } from '@opentrons/shared-data'

import type { LabwareDefinition } from '@opentrons/shared-data'

export function getAllDefs(): LabwareDefinition[] {
  return Object.values(getAllDefinitions())
}
