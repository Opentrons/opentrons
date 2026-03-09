import type {
  LabwareLocation,
  OnDeckLabwareLocation,
} from '../../command/types/setup'
import type { AddressableAreaName } from '../../js'

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
