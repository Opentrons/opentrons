import { getLoadedLabware } from "./accessors"
import { CompletedProtocolAnalysis, getModuleDisplayName, getModuleType, getOccludedSlotCountForModule, OT2_STANDARD_MODEL } from '@opentrons/shared-data'
import { TFunction } from "react-i18next"
import { getModuleDisplayLocation } from "./getModuleDisplayLocation"
import { getModuleModel } from "./getModuleModel"

export function getLabwareDisplayLocation(analysis: CompletedProtocolAnalysis, labwareId: string, t: TFunction): string {
  const loadedLabware = getLoadedLabware(analysis, labwareId) 

  if (loadedLabware == null || loadedLabware.location === 'offDeck') {
    return t('off_deck')
  } else if ('slotName' in loadedLabware.location) {
    return t('slot', {slot_name: loadedLabware.location.slotName}) 
  } else if ('moduleId' in loadedLabware.location) {
    const moduleModel = getModuleModel(analysis, loadedLabware.location.moduleId)
    if (moduleModel == null) {
      console.warn('labware is located on an unknown module model')
      return ''
    }
    const occludedSlotCount = getOccludedSlotCountForModule(getModuleType(moduleModel), analysis.robotType ?? OT2_STANDARD_MODEL)
    return t('module_in_slot', {
      count: occludedSlotCount,
      module: getModuleDisplayName(moduleModel),
      slot_name: getModuleDisplayLocation(analysis, loadedLabware.location.moduleId),
    }) 
  } else {
    return ''
  }
}