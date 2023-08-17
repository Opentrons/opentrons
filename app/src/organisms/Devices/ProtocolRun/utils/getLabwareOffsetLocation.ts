import { getLabwareLocation } from './getLabwareLocation'
import { getModuleInitialLoadInfo } from './getModuleInitialLoadInfo'
import type { LabwareOffsetLocation } from '@opentrons/api-client'
import type {
  LoadedModule,
  LoadedLabware,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
// this logic to derive the LabwareOffsetLocation from the LabwareLocation
// is required because the backend needs to know a module's model (not its ID)
// in order to apply offsets. This logic should be removed once the backend can
// accept a module id as a labware's location (to match the LabwareLocation interface)
export const getLabwareOffsetLocation = (
  labwareId: string,
  commands: ProtocolAnalysisOutput['commands'],
  modules: LoadedModule[],
  labware: LoadedLabware[]
): LabwareOffsetLocation | null => {
  let location: LabwareOffsetLocation | null = null
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
  } else if ('labwareId' in labwareLocation) {
    const adapter = labware.find(lw => lw.id === labwareLocation.labwareId)
    if (adapter == null) {
      location = null
    } else if (adapter.location === 'offDeck') {
      location = null
    } else if ('slotName' in adapter.location) {
      location = {
        slotName: adapter.location.slotName,
        definitionUri: adapter.definitionUri,
      }
    } else if ('moduleId' in adapter.location) {
      const adapterModLocation = adapter.location.moduleId
      const module = modules.find(module => module.id === adapterModLocation)
      const moduleModel = module?.model
      const slotName = getModuleInitialLoadInfo(
        adapter.location.moduleId,
        commands
      ).location.slotName
      location = { slotName, moduleModel, definitionUri: adapter.definitionUri }
    }
  } else {
    location = labwareLocation
  }
  return location
}
