import {
  getModuleDisplayName,
  getModuleType,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import type { LabwareOffsetLocation } from '@opentrons/api-client'
import type { TFunction } from 'i18next'

export function getDisplayLocation(
  location: LabwareOffsetLocation,
  t: TFunction
): string {
  const slotDisplayLocation = t('slot_name', { slotName: location.slotName })
  if ('moduleModel' in location && location.moduleModel != null) {
    const { moduleModel } = location
    const moduleDisplayName = getModuleDisplayName(moduleModel)
    if (getModuleType(moduleModel) === THERMOCYCLER_MODULE_TYPE) {
      return moduleDisplayName
    } else {
      return t('module_in_slot', {
        module: moduleDisplayName,
        slot: slotDisplayLocation,
      })
    }
  } else {
    return slotDisplayLocation
  }
}
