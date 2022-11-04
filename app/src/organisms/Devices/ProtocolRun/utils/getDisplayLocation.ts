import { getModuleDisplayName, getModuleType, LoadedModule, THERMOCYCLER_MODULE_TYPE } from "@opentrons/shared-data"
import type { LabwareLocation } from "@opentrons/shared-data/protocol/types/schemaV6/command/setup"
import type { TFunction } from "react-i18next"

export function getDisplayLocation(
  location: LabwareLocation,
  modules: LoadedModule[],
  t: TFunction 
): string {
  if (location === 'offDeck') {
    return t('off_deck')
  } else if ('moduleId' in location) {
    const { moduleId } = location
    const module = modules.find(m => m.id === moduleId)
    const moduleDisplayName = module != null ? getModuleDisplayName(module.model) : ''
    if (module != null && getModuleType(module.model) === THERMOCYCLER_MODULE_TYPE) {
      return moduleDisplayName
    } else {
      return t('module_in_slot', {
        module: moduleDisplayName,
        slot: module?.location.slotName ?? '',
      })
    }
  } else {
    return t('slot_name', { slot_name: location.slotName })
  }
}