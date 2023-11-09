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
  const labwareLocation = getLabwareLocation(labwareId, commands)

  if (labwareLocation === 'offDeck') {
    return null
  } else if ('moduleId' in labwareLocation) {
    const module = modules.find(
      module => module.id === labwareLocation.moduleId
    )
    const moduleModel = module?.model
    const slotName = getModuleInitialLoadInfo(
      labwareLocation.moduleId,
      commands
    ).location.slotName
    return { slotName, moduleModel }
  } else if ('labwareId' in labwareLocation) {
    const adapter = labware.find(lw => lw.id === labwareLocation.labwareId)
    if (adapter == null || adapter.location === 'offDeck') {
      return null
    } else if ('slotName' in adapter.location) {
      return {
        slotName: adapter.location.slotName,
        definitionUri: adapter.definitionUri,
      }
    } else if ('addressableAreaName' in adapter.location) {
      return {
        slotName: adapter.location.addressableAreaName,
        definitionUri: adapter.definitionUri,
      }
    } else if ('moduleId' in adapter.location) {
      const moduleIdUnderAdapter = adapter.location.moduleId
      const moduleModel = modules.find(
        module => module.id === moduleIdUnderAdapter
      )?.model
      if (moduleModel == null) return null
      const slotName = getModuleInitialLoadInfo(
        adapter.location.moduleId,
        commands
      ).location.slotName
      return { slotName, moduleModel, definitionUri: adapter.definitionUri }
    }
  } else {
    return {
      slotName:
        'addressableAreaName' in labwareLocation
          ? labwareLocation.addressableAreaName
          : labwareLocation.slotName,
    }
  }
  return null
}
