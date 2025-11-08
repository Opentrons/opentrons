import {
  FLEX_STACKER_MODULE_TYPE,
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_TYPE,
} from '..'

import type { ModuleType } from '../types'

const getFlexStackerDisplayLocationFromSlotName = (
  slotName: string
): string => {
  return `${slotName}+${slotName[0]}4`
}

/**
 * Returns a string to represent a module's deck location, to be used in Deck Configuration and Protocol Setup.
 * @param moduleType - The type of the module.
 * @param slotName - The slot name where the module is located.
 * @returns A string representing the module's deck label.
 *
 * For all labware loaded on/offdeck or on module, use `getLabwareDeckLabel` instead.
 */
export function getModuleDeckLabel(
  moduleType: ModuleType,
  slotName: string
): string {
  switch (moduleType) {
    case THERMOCYCLER_MODULE_TYPE:
      if (slotName === '7') {
        // OT-2 thermocycler module slotName is always '7'
        return TC_MODULE_LOCATION_OT2
      } else {
        return TC_MODULE_LOCATION_OT3
      }
    case FLEX_STACKER_MODULE_TYPE:
      return getFlexStackerDisplayLocationFromSlotName(slotName)
    default:
      return slotName
  }
}
