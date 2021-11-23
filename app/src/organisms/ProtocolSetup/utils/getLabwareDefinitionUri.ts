import { ProtocolFile } from '@opentrons/shared-data'

export function getLabwareDefinitionUri(
  labwareId: string,
  labware?: ProtocolFile<{}>['labware']
): string {
  const labwareDefinitionId = labware?.[labwareId].definitionId
  if (labwareDefinitionId == null) {
    throw new Error(
      'expected to be able to find labware definition id for labware, but could not'
    )
  }
  return labwareDefinitionId.substring(0, labwareDefinitionId.length - 3)
}
