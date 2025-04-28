import { getAllDefinitions } from '@opentrons/shared-data'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export function getAllDefs(): LabwareDefinition2[] {
  return Object.values(getAllDefinitions())
}
