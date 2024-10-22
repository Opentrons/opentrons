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
  LabwareDefinition2,
  LabwareLocation,
  RobotType,
} from '@opentrons/shared-data'
import type { LoadedLabwares } from '/app/local-resources/labware'
import type { LoadedModules } from '/app/local-resources/modules'

interface LabwareDisplayLocationBaseParams {
  location: LabwareLocation | null
  loadedModules: LoadedModules
  loadedLabwares: LoadedLabwares
  robotType: RobotType
  t: TFunction
  isOnDevice?: boolean
}

export interface LabwareDisplayLocationSlotOnly
  extends LabwareDisplayLocationBaseParams {
  detailLevel: 'slot-only'
}

export interface LabwareDisplayLocationFull
  extends LabwareDisplayLocationBaseParams {
  detailLevel?: 'full'
  allRunDefs: LabwareDefinition2[]
}

export type LabwareDisplayLocationParams =
  | LabwareDisplayLocationSlotOnly
  | LabwareDisplayLocationFull

// detailLevel applies to nested labware. If 'full', return copy that includes the actual peripheral that nests the
// labware, ex, "in module XYZ in slot C1".
// If 'slot-only', return only the slot name, ex "in slot C1".
export function getLabwareDisplayLocation(
  params: LabwareDisplayLocationParams
): string {
  const {
    loadedLabwares,
    loadedModules,
    location,
    robotType,
    t,
    isOnDevice = false,
    detailLevel = 'full',
  } = params

  if (location == null) {
    console.error('Cannot get labware display location. No location provided.')
    return ''
  } else if (location === 'offDeck') {
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
      console.error('labware is located on an unknown module model')
      return ''
    }
    const slotName = getModuleDisplayLocation(loadedModules, location.moduleId)

    if (detailLevel === 'slot-only') {
      return t('slot', { slot_name: slotName })
    }

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
  } else if ('labwareId' in location) {
    if (!Array.isArray(loadedLabwares)) {
      console.error('Cannot get display location from loaded labwares object')
      return ''
    }
    const adapter = loadedLabwares.find(lw => lw.id === location.labwareId)

    if (adapter == null) {
      console.error('labware is located on an unknown adapter')
      return ''
    } else if (detailLevel === 'slot-only') {
      return getLabwareDisplayLocation({
        ...params,
        location: adapter.location,
      })
    } else if (detailLevel === 'full') {
      const { allRunDefs } = params as LabwareDisplayLocationFull
      const adapterDef = allRunDefs.find(
        def => getLabwareDefURI(def) === adapter?.definitionUri
      )
      const adapterDisplayName =
        adapterDef != null ? getLabwareDisplayName(adapterDef) : ''

      if (adapter.location === 'offDeck') {
        return t('off_deck')
      } else if (
        'slotName' in adapter.location ||
        'addressableAreaName' in adapter.location
      ) {
        const slotName =
          'slotName' in adapter.location
            ? adapter.location.slotName
            : adapter.location.addressableAreaName
        return t('adapter_in_slot', {
          adapter: adapterDisplayName,
          slot: slotName,
        })
      } else if ('moduleId' in adapter.location) {
        const moduleIdUnderAdapter = adapter.location.moduleId

        if (!Array.isArray(loadedModules)) {
          console.error(
            'Cannot get display location from loaded modules object'
          )
          return ''
        }

        const moduleModel = loadedModules.find(
          module => module.id === moduleIdUnderAdapter
        )?.model
        if (moduleModel == null) {
          console.error('labware is located on an adapter on an unknown module')
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
        console.error(
          'Unhandled adapter location for determining display location.'
        )
        return ''
      }
    } else {
      console.error('Unhandled detail level for determining display location.')
      return ''
    }
  } else {
    console.error('display location could not be established: ', location)
    return ''
  }
}
