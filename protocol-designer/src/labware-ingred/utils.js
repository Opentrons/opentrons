// @flow
import { sortedSlotnames, type DeckSlot } from '@opentrons/components'
import {
  getLabwareDisplayName,
  type LabwareDefinition2,
} from '@opentrons/shared-data'
import type { DisplayLabware } from './types'

export const labwareToDisplayName = (
  displayLabware: ?DisplayLabware,
  labwareDef: LabwareDefinition2
) => {
  const disambiguationNumber = displayLabware
    ? displayLabware.disambiguationNumber
    : ''
  return (
    (displayLabware && displayLabware.nickname) ||
    `${getLabwareDisplayName(labwareDef)} (${disambiguationNumber})`
  )
}

export function getNextAvailableSlot(labwareLocations: {
  [labwareId: string]: DeckSlot,
}): ?DeckSlot {
  const filledLocations = Object.values(labwareLocations)
  return sortedSlotnames.find(
    slot => !filledLocations.some(filledSlot => filledSlot === slot)
  )
}
