import type { AddressableAreaName } from '../../deck'
import { STANDARD_FLEX_SLOTS, STANDARD_OT2_SLOTS } from '../fixtures'

import type {
  LabwareLocation,
  OnDeckLabwareLocation,
} from '../../command/types/setup'

export const changeAnyUseOfMeToPreserveStructure_thisIsAnOffDeckLocationInASlotName =
  (quoteUnquoteSlotName: string): boolean =>
    ['offDeck', 'systemLocation', 'wasteChuteLocation'].includes(
      quoteUnquoteSlotName
    )

export const locationIsOffDeck = (
  labwareLocation: LabwareLocation
): labwareLocation is 'offDeck' | 'systemLocation' | 'wasteChuteLocation' =>
  labwareLocation === 'offDeck' ||
  labwareLocation === 'systemLocation' ||
  labwareLocation === 'wasteChuteLocation'

export const locationIsOnDeck = (
  labwareLocation: LabwareLocation
): labwareLocation is OnDeckLabwareLocation =>
  !locationIsOffDeck(labwareLocation)

export const locationIsOnLabware = (
  labwareLocation: LabwareLocation
): labwareLocation is { labwareId: string } =>
  locationIsOnDeck(labwareLocation) && 'labwareId' in labwareLocation

export const locationIsOnSlot = (
  labwareLocation: LabwareLocation
): labwareLocation is { slotName: string } =>
  locationIsOnDeck(labwareLocation) && 'slotName' in labwareLocation

export const locationIsOnModule = (
  labwareLocation: LabwareLocation
): labwareLocation is { moduleId: string } =>
  locationIsOnDeck(labwareLocation) && 'moduleId' in labwareLocation

export const locationIsOnAddressableArea = (
  labwareLocation: LabwareLocation
): labwareLocation is { addressableAreaName: AddressableAreaName } =>
  locationIsOnDeck(labwareLocation) && 'addressableAreaName' in labwareLocation

export const getIsValidSlotName = (slot: string): boolean => {
  return (
    STANDARD_OT2_SLOTS.includes(slot as AddressableAreaName) ||
    STANDARD_FLEX_SLOTS.includes(slot as AddressableAreaName) ||
    slot === 'A4' ||
    slot === 'B4' ||
    slot === 'C4' ||
    slot === 'D4'
  )
}
