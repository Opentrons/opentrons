import type { LabwareOffsetLocation } from '@opentrons/api-client'
import { LoadedModule, ProtocolAnalysisOutput } from '@opentrons/shared-data'
import { getLabwareLocation } from './getLabwareLocation'
import { getModuleInitialLoadInfo } from './getModuleInitialLoadInfo'

// this logic to derive the LabwareOffsetLocation from the LabwareLocation
// is required because the backend needs to know a module's model (not its ID)
// in order to apply offsets. This logic should be removed once the backend can
// accept a module id as a labware's location (to match the LabwareLocation interface)
export const getLabwareOffsetLocation = (
  labwareId: string,
  commands: ProtocolAnalysisOutput['commands'],
  modules: LoadedModule[]
): LabwareOffsetLocation | null => {
  let location: LabwareOffsetLocation | null
  const labwareLocation = getLabwareLocation(labwareId, commands)
  if (labwareLocation === 'offDeck') {
    location = null
  } else if ('moduleId' in labwareLocation) {
    const module = modules.find(
      module => module.id === labwareLocation.moduleId
    )
    const moduleModel = module?.model
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
