import { getLabwareDefURI } from '@opentrons/shared-data'

import type { LabwareDefinition, LoadedLabware } from '@opentrons/shared-data'

// Delete this util once there is a better identifier for labware offsets on the backend
export function getLabwareDefinitionUri(
  labwareId: string,
  labware: LoadedLabware[],
  labwareDefinitions: {
    [definitionUri: string]: LabwareDefinition
  }
): string {
  const labwareDefinitionUri = labware.find(item => item.id === labwareId)
    ?.definitionUri
  if (labwareDefinitionUri == null) {
    throw new Error(
      'expected to be able to find labware definition uri for labware, but could not'
    )
  }
  const labwareDefinition = labwareDefinitions[labwareDefinitionUri]
  if (labwareDefinition == null) {
    throw new Error(
      'expected to be able to find labware definitions for protocol, but could not'
    )
  }
  return getLabwareDefURI(labwareDefinition)
}
