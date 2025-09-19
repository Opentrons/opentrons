import {
  getAllLegacyDefinitions,
  getAllDefinitions as getLatestDefinitions,
} from '@opentrons/shared-data'

import type {
  LabwareDefinition,
  LabwareDefinition1,
} from '@opentrons/shared-data'

export function getLegacyLabwareDef(
  loadName: string | null | undefined
): LabwareDefinition1 | null {
  if (loadName != null) {
    return getAllLegacyDefinitions()[loadName]
  }
  return null
}

export function getLatestLabwareDef(
  loadName: string | null | undefined
): LabwareDefinition | null {
  const def = Object.values(getLatestDefinitions()).find(
    d => d.parameters.loadName === loadName
  )
  return def || null
}
