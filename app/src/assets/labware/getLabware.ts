import {
  getAllLegacyDefinitions,
  getAllDefinitions as getLatestDefinitions,
  type LabwareDefinition1,
  type LabwareDefinition2,
  type LabwareDefByDefURI,
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
): LabwareDefinition2 | null {
  const def = Object.values(getLatestDefinitions()).find(d => d.parameters.loadName === loadName)
  return def || null
}
