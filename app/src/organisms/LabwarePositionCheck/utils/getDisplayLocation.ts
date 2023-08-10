import {
  getModuleDisplayName,
  getModuleType,
  THERMOCYCLER_MODULE_TYPE,
  CompletedProtocolAnalysis,
} from '@opentrons/shared-data'
import { getLabwareDef } from './labware'
import type { LabwareOffsetLocation } from '@opentrons/api-client'
import type { TFunction } from 'i18next'

export function getDisplayLocation(
  location: LabwareOffsetLocation,
  protocolData: CompletedProtocolAnalysis,
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
  } else if ('labwareId' in location && location.labwareId != null) {
    const adapterDisplayName = getLabwareDef(location.labwareId, protocolData)
      ?.metadata.displayName
    if ('moduleModel' in location && location.moduleModel != null) {
      const { moduleModel } = location
      const moduleDisplayName = getModuleDisplayName(moduleModel)
      if (getModuleType(moduleModel) === THERMOCYCLER_MODULE_TYPE) {
        return moduleDisplayName
      } else {
        return t('adapter_in_mod_in_slot', {
          adapter: adapterDisplayName,
          module: moduleDisplayName,
          slot: slotDisplayLocation,
        })
      }
    } else {
      return t('adapter_in_slot', {
        adapter: adapterDisplayName,
        slot: slotDisplayLocation,
      })
    }
  } else {
    return slotDisplayLocation
  }
}
