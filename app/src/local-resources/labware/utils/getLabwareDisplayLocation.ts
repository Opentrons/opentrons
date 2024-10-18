import {
  getLabwareDefURI,
  getLabwareDisplayName,
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
} from '@opentrons/shared-data'

import {
  getModuleModel,
  getModuleDisplayLocation,
} from '/app/local-resources/modules'

import type { TFunction } from 'i18next'
import type {
  RobotType,
  LabwareLocation,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { LoadedModules } from '/app/local-resources/modules'
import type { LoadedLabwares } from '/app/local-resources/labware'

export interface UseLabwareDisplayLocationProps {
  location: LabwareLocation | null
  loadedModules: LoadedModules
  loadedLabwares: LoadedLabwares
  allRunDefs: LabwareDefinition2[]
  robotType: RobotType
  t: TFunction
  isOnDevice?: boolean
}

export function getLabwareDisplayLocation({
  loadedLabwares,
  loadedModules,
  allRunDefs,
  location,
  robotType,
  t,
  isOnDevice = false,
}: UseLabwareDisplayLocationProps): string {
  if (location == null) {
    console.warn('Cannot get labware display location. No location provided.')
    return ''
  }
  if (location === 'offDeck') {
    return t('off_deck')
  } else if ('slotName' in location) {
    return isOnDevice
      ? location.slotName
      : t('slot', { slot_name: location.slotName })
  } else if ('addressableAreaName' in location) {
    return isOnDevice
      ? location.addressableAreaName
      : t('slot', { slot_name: location.addressableAreaName })
  } else if ('moduleId' in location) {
    const moduleModel = getModuleModel(loadedModules, location.moduleId)
    if (moduleModel == null) {
      console.warn('labware is located on an unknown module model')
      return ''
    } else {
      const slotName = getModuleDisplayLocation(
        loadedModules,
        location.moduleId
      )
      return isOnDevice
        ? `${getModuleDisplayName(moduleModel)}, ${slotName}`
        : t('module_in_slot', {
            count: getOccludedSlotCountForModule(
              getModuleType(moduleModel),
              robotType
            ),
            module: getModuleDisplayName(moduleModel),
            slot_name: slotName,
          })
    }
  } else if ('labwareId' in location) {
    if (!Array.isArray(loadedLabwares)) {
      console.warn('Cannot get display location from loaded labwares object')
      return ''
    }
    const adapter = loadedLabwares.find(lw => lw.id === location.labwareId)
    const adapterDef = allRunDefs.find(
      def => getLabwareDefURI(def) === adapter?.definitionUri
    )
    const adapterDisplayName =
      adapterDef != null ? getLabwareDisplayName(adapterDef) : ''

    if (adapter == null) {
      console.warn('labware is located on an unknown adapter')
      return ''
    } else if (adapter.location === 'offDeck') {
      return t('off_deck')
    } else if ('slotName' in adapter.location) {
      return t('adapter_in_slot', {
        adapter: adapterDisplayName,
        slot: adapter.location.slotName,
      })
    } else if ('addressableAreaName' in adapter.location) {
      return t('adapter_in_slot', {
        adapter: adapterDisplayName,
        slot: adapter.location.addressableAreaName,
      })
    } else if ('moduleId' in adapter.location) {
      const moduleIdUnderAdapter = adapter.location.moduleId

      if (!Array.isArray(loadedModules)) {
        console.warn('Cannot get display location from loaded labwares object')
        return ''
      }

      const moduleModel = loadedModules.find(
        module => module.id === moduleIdUnderAdapter
      )?.model
      if (moduleModel == null) {
        console.warn('labware is located on an adapter on an unknown module')
        return ''
      }
      const slotName = getModuleDisplayLocation(
        loadedModules,
        adapter.location.moduleId
      )
      return t('adapter_in_mod_in_slot', {
        count: getOccludedSlotCountForModule(
          getModuleType(moduleModel),
          robotType
        ),
        module: getModuleDisplayName(moduleModel),
        adapter: adapterDisplayName,
        slot: slotName,
      })
    } else {
      console.warn(
        'display location on adapter could not be established: ',
        location
      )
      return ''
    }
  } else {
    console.warn('display location could not be established: ', location)
    return ''
  }
}
