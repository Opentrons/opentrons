import capitalize from 'lodash/capitalize'
import {
  getModuleDisplayName,
  getModuleType,
  THERMOCYCLER_MODULE_TYPE,
  getLabwareDefURI,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { LabwareOffsetLocation } from '@opentrons/api-client'
import type { TFunction } from 'i18next'

export function getDisplayLocation(
  location: LabwareOffsetLocation,
  labwareDefinitions: LabwareDefinition2[],
  t: TFunction
): string {
  const slotDisplayLocation = t('slot_name', { slotName: location.slotName })

  if ('definitionUri' in location && location.definitionUri != null) {
    const adapterDisplayName = labwareDefinitions.find(
      def => getLabwareDefURI(def) === location.definitionUri
    )?.metadata.displayName

    if ('moduleModel' in location && location.moduleModel != null) {
      const { moduleModel } = location
      const moduleDisplayName = getModuleDisplayName(moduleModel)
      if (getModuleType(moduleModel) === THERMOCYCLER_MODULE_TYPE) {
        return t('adapter_in_tc', {
          adapter: adapterDisplayName,
          module: moduleDisplayName,
        })
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
  } else if ('moduleModel' in location && location.moduleModel != null) {
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
    return capitalize(slotDisplayLocation)
  }
}
