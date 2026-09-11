import {
  changeAnyUseOfMeToPreserveStructure_thisIsAnOffDeckLocationInASlotName,
  FLEX_STACKER_MODULE_TYPE,
  getModuleDeckLabel,
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
  TRASH_BIN_FIXTURE,
  WASTE_CHUTE_ADDRESSABLE_AREAS,
} from '@opentrons/shared-data'

import {
  getLabwareLocation,
  getLabwareLocationFromSequence,
} from './getLabwareLocation'

import type { TFunction } from 'i18next'
import type {
  AddressableAreaName,
  LabwareLocation,
  LabwareLocationSequence,
} from '@opentrons/shared-data'
import type {
  LocationFullParams,
  LocationSlotOnlyParams,
} from './getLabwareLocation'

export interface DisplayLocationSlotOnlyParams extends Omit<
  LocationSlotOnlyParams,
  'location'
> {
  t: TFunction
  isOnDevice?: boolean
  includeSlotText?: boolean
  location?: LabwareLocation | LabwareLocationSequence | null
}
export interface DisplayLocationFullParams extends Omit<
  LocationFullParams,
  'location'
> {
  t: TFunction
  isOnDevice?: boolean
  includeSlotText?: boolean
  location?: LabwareLocation | LabwareLocationSequence | null
}
export type DisplayLocationParams =
  DisplayLocationSlotOnlyParams | DisplayLocationFullParams

// detailLevel applies to nested labware. If 'full', return copy that includes the actual peripheral that nests the
// labware, ex, "in module XYZ in slot C1".
// If 'slot-only', return only the slot name, ex "in slot C1".
export function getLabwareDisplayLocation(
  params: DisplayLocationParams
): string {
  const { t, isOnDevice = false, location, includeSlotText = true } = params
  const locationResult = Array.isArray(location)
    ? getLabwareLocationFromSequence({
        ...params,
        locationSequence: location,
      })
    : getLabwareLocation({
        ...params,
        location: location ?? null,
      })
  if (locationResult == null) {
    return ''
  }

  const { slotName, moduleModel, adapterName } = locationResult

  if (
    changeAnyUseOfMeToPreserveStructure_thisIsAnOffDeckLocationInASlotName(
      slotName
    )
  ) {
    return t('off_deck')
  }
  // Simple slot location
  else if (moduleModel == null && adapterName == null) {
    const validatedSlotCopy = handleSpecialSlotNames(slotName, t)
    return isOnDevice || !includeSlotText
      ? validatedSlotCopy.odd
      : validatedSlotCopy.desktop
  }
  // Module location without adapter
  else if (moduleModel != null && adapterName == null) {
    const moduleSlot = getModuleDeckLabel(getModuleType(moduleModel), slotName)
    if (getModuleType(moduleModel) === FLEX_STACKER_MODULE_TYPE) {
      // in hopper location always return Stacker {{row}}
      return t('stacker_hopper_display', {
        row: getSlotRow(moduleSlot as string),
      })
    }
    if (params.detailLevel === 'slot-only') {
      return includeSlotText ? t('slot', { slot_name: moduleSlot }) : moduleSlot
    }
    return isOnDevice
      ? `${getModuleDisplayName(moduleModel)}, ${moduleSlot}`
      : t('module_in_slot', {
          count: getOccludedSlotCountForModule(
            getModuleType(moduleModel),
            params.robotType
          ),
          module: getModuleDisplayName(moduleModel),
          slot_name: moduleSlot,
        })
  }
  // Adapter locations
  else if (adapterName != null) {
    if (moduleModel == null) {
      return t('adapter_in_slot', {
        adapter: adapterName,
        slot: slotName,
      })
    } else {
      return t('adapter_in_mod_in_slot', {
        count: getOccludedSlotCountForModule(
          getModuleType(moduleModel),
          params.robotType
        ),
        module: getModuleDisplayName(moduleModel),
        adapter: adapterName,
        slot: slotName,
      })
    }
  } else {
    return ''
  }
}

function getSlotRow(slotName: string): string {
  return slotName.charAt(0)
}

// Sometimes we don't want to show the actual slotName, so we special case the text here.
function handleSpecialSlotNames(
  slotName: string,
  t: TFunction
): { odd: string; desktop: string } {
  if (WASTE_CHUTE_ADDRESSABLE_AREAS.includes(slotName as AddressableAreaName)) {
    return { odd: t('waste_chute'), desktop: t('waste_chute') }
  } else if (
    slotName === TRASH_BIN_FIXTURE ||
    MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(slotName as AddressableAreaName)
  ) {
    return { odd: t('trash_bin'), desktop: t('trash_bin') }
  } else {
    return {
      odd: slotName,
      desktop: t('slot', { slot_name: slotName }),
    }
  }
}
