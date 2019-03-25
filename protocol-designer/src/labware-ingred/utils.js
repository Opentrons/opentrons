// @flow
import {humanizeLabwareType, sortedSlotnames, type DeckSlot} from '@opentrons/components'
import type {DisplayLabware} from './types'

export const labwareToDisplayName = (
  displayLabware: ?DisplayLabware,
  labwareType: string
) => {
  const disambiguationNumber = displayLabware ? displayLabware.disambiguationNumber : ''
  return (displayLabware && displayLabware.nickname) ||
  `${humanizeLabwareType(labwareType)} (${disambiguationNumber})`
}

export function getNextAvailableSlot (labwareLocations: {[labwareId: string]: DeckSlot}): ?DeckSlot {
  const filledLocations = Object.values(labwareLocations)
  return sortedSlotnames.find(slot => !filledLocations.some(filledSlot => filledSlot === slot))
}
