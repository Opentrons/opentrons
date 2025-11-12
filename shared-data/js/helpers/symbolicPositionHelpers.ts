// TODO: Move to helpers/deckDeclarationHelpers.ts
export const STANDARD_OT2_SLOTS: AddressableAreaName[] = [
  ADDRESSABLE_AREA_1,
  ADDRESSABLE_AREA_2,
  ADDRESSABLE_AREA_3,
  ADDRESSABLE_AREA_4,
  ADDRESSABLE_AREA_5,
  ADDRESSABLE_AREA_6,
  ADDRESSABLE_AREA_7,
  ADDRESSABLE_AREA_8,
  ADDRESSABLE_AREA_9,
  ADDRESSABLE_AREA_10,
  ADDRESSABLE_AREA_11,
]

// TODO: Move to helpers/deckDeclarationHelpers.ts
export const STANDARD_FLEX_SLOTS: AddressableAreaName[] = [
  A1_ADDRESSABLE_AREA,
  A2_ADDRESSABLE_AREA,
  A3_ADDRESSABLE_AREA,
  B1_ADDRESSABLE_AREA,
  B2_ADDRESSABLE_AREA,
  B3_ADDRESSABLE_AREA,
  C1_ADDRESSABLE_AREA,
  C2_ADDRESSABLE_AREA,
  C3_ADDRESSABLE_AREA,
  D1_ADDRESSABLE_AREA,
  D2_ADDRESSABLE_AREA,
  D3_ADDRESSABLE_AREA,
]

import type {
  LabwareLocation,
  OnDeckLabwareLocation,
} from '../../command/types/setup'
import { ADDRESSABLE_AREA_1, ADDRESSABLE_AREA_2, ADDRESSABLE_AREA_3, ADDRESSABLE_AREA_4, ADDRESSABLE_AREA_5, ADDRESSABLE_AREA_6, ADDRESSABLE_AREA_7, ADDRESSABLE_AREA_8, ADDRESSABLE_AREA_9, ADDRESSABLE_AREA_10, ADDRESSABLE_AREA_11, A1_ADDRESSABLE_AREA, A2_ADDRESSABLE_AREA, A3_ADDRESSABLE_AREA, B1_ADDRESSABLE_AREA, B2_ADDRESSABLE_AREA, B3_ADDRESSABLE_AREA, C1_ADDRESSABLE_AREA, C2_ADDRESSABLE_AREA, C3_ADDRESSABLE_AREA, D1_ADDRESSABLE_AREA, D2_ADDRESSABLE_AREA, D3_ADDRESSABLE_AREA, type AddressableAreaName } from '../../js'

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
  console.log('slot: ', slot)
  console.log('STANDARD_OT2_SLOTS: ', STANDARD_OT2_SLOTS)
  console.log('STANDARD_FLEX_SLOTS: ', STANDARD_FLEX_SLOTS)
  return (
    STANDARD_OT2_SLOTS.includes(slot as AddressableAreaName) ||
    STANDARD_FLEX_SLOTS.includes(slot as AddressableAreaName) ||
    slot === 'A4' ||
    slot === 'B4' ||
    slot === 'C4' ||
    slot === 'D4'
  )
}
