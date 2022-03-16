import { getLabwareDefURI } from '@opentrons/shared-data'
import type { ProtocolFile } from '@opentrons/shared-data'

// Delete this util once there is a better identifier for labware offsets on the backend
export function getLabwareDefinitionUri(
  labwareId: string,
  labware: ProtocolFile<{}>['labware'],
  labwareDefinitions: ProtocolFile<{}>['labwareDefinitions']
): string {
  const labwareDefinitionId = labware[labwareId].definitionId
  if (labwareDefinitionId == null) {
    throw new Error(
      'expected to be able to find labware definition id for labware, but could not'
    )
  }
  const labwareDefinition = labwareDefinitions[labwareDefinitionId]
  if (labwareDefinition == null) {
    throw new Error(
      'expected to be able to find labware definitions for protocol, but could not'
    )
  }
  return getLabwareDefURI(labwareDefinition)
}
