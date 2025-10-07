import { getIsTiprack, getPositionFromSlotId } from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import type { DeckDefinition } from '@opentrons/shared-data'
import type {
  AllTemporalPropertiesForTimelineFrame,
  LabwareOnDeck,
} from '../../../../../../step-forms'

export const getIsTiprackSelectable = (
  labware: LabwareOnDeck,
  formTiprackUri: string
): boolean => {
  // TODO: check if tiprack is reachable by pipette
  const { def, labwareDefURI } = labware
  return getIsTiprack(def) && labwareDefURI === formTiprackUri
}

// arbitrary constant to show slots surrounding the selected tiprack
// TODO: confirm this padding with Design
const PADDING_MM_X = 50

export const getViewboxFromSelectedLabware = (
  selectedLabwareId: string,
  activeDeckSetup: AllTemporalPropertiesForTimelineFrame,
  deckDef: DeckDefinition
): string | null => {
  const { labware } = activeDeckSetup
  const selectedLabware = labware[selectedLabwareId]
  if (selectedLabware == null) {
    return null
  }
  const [deckXDimension, deckYDimension] = deckDef.dimensions
  const ratio = deckYDimension / deckXDimension

  // preserve aspect ratio
  const paddingMMY = PADDING_MM_X * ratio
  const { xDimension, yDimension } = selectedLabware.def.dimensions
  const slot = getSlotInLocationStack(selectedLabware.stack)
  if (selectedLabwareId == null) {
    return null
  }
  const slotPosition = getPositionFromSlotId(slot, deckDef)
  if (slotPosition == null) {
    return null
  }
  return `${slotPosition[0] - PADDING_MM_X} ${slotPosition[1] - paddingMMY} ${
    xDimension + PADDING_MM_X * 2
  } ${yDimension + paddingMMY * 2}`
}
