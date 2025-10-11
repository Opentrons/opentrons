import { getIsTiprack, getPositionFromSlotId } from '@opentrons/shared-data'
import {
  COLUMN_4_SLOTS,
  getSlotInLocationStack,
} from '@opentrons/step-generation'

import type { DeckDefinition } from '@opentrons/shared-data'
import type {
  AllTemporalPropertiesForTimelineFrame,
  LabwareOnDeck,
} from '../../../../../../step-forms'

export const getIsTiprackSelectable = (
  labware: LabwareOnDeck,
  formTiprackUri: string
): boolean => {
  // TODO: check if tiprack is on stacker. Will bottom of stack still be slot?
  const { def, labwareDefURI, stack } = labware
  const slot = getSlotInLocationStack(stack)
  return (
    getIsTiprack(def) &&
    labwareDefURI === formTiprackUri &&
    !COLUMN_4_SLOTS.includes(slot)
  )
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
  const paddingMmY = PADDING_MM_X * ratio
  const { xDimension, yDimension } = selectedLabware.def.dimensions
  const slot = getSlotInLocationStack(selectedLabware.stack)
  const slotPosition = getPositionFromSlotId(slot, deckDef)
  if (slotPosition == null) {
    return null
  }
  return `${slotPosition[0] - PADDING_MM_X} ${slotPosition[1] - paddingMmY} ${
    xDimension + PADDING_MM_X * 2
  } ${yDimension + paddingMmY * 2}`
}
