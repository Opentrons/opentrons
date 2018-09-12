// @flow
// ========= OT2 DECK ===============
import {SLOT_WIDTH_MM, SLOT_HEIGHT_MM} from '@opentrons/shared-data'

export const SLOTNAME_MATRIX = [ // used for deckmap
  ['10', '11', '12'],
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
]

export const sortedSlotnames = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

export const TRASH_SLOTNAME = '12'

// Slot dims in mm
export const SLOT_SPACING_MM = 5
export const SLOT_OFFSET_MM = 10
export {
  SLOT_WIDTH_MM,
  SLOT_HEIGHT_MM,
}
