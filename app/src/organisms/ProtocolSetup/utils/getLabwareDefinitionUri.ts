import { ProtocolFile } from '@opentrons/shared-data'

// Delete this util once there is a better identifier for labware offsets on the backend
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
  // this util simply strips the "_id" off of the labwareDefinitionId
  const ID_POSTFIX_LENGTH = 3
  return labwareDefinitionId.substring(
    0,
    labwareDefinitionId.length - ID_POSTFIX_LENGTH
  )
}
