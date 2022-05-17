import { getLabwareLocation } from './getLabwareLocation'
import { getModuleInitialLoadInfo } from './getModuleInitialLoadInfo'
import type { LabwareOffsetLocation } from '@opentrons/api-client'
import { ProtocolAnalysisFile } from '@opentrons/shared-data'

// this logic to derive the LabwareOffsetLocation from the LabwareLocation
// is required because the backend needs to know a module's model (not its ID)
// in order to apply offsets. This logic should be removed once the backend can
// accept a module id as a labware's location (to match the LabwareLocation interface)
export const getLabwareOffsetLocation = (
  labwareId: string,
  commands: ProtocolAnalysisFile['commands'],
  modules: ProtocolAnalysisFile['modules']
): LabwareOffsetLocation => {
  let location: LabwareOffsetLocation
  const labwareLocation = getLabwareLocation(labwareId, commands)
  if ('moduleId' in labwareLocation) {
    const moduleModel = modules[labwareLocation.moduleId].model
    const slotName = getModuleInitialLoadInfo(
      labwareLocation.moduleId,
      commands
    ).location.slotName
    location = { slotName, moduleModel }
  } else {
    location = labwareLocation
  }
  return location
}
