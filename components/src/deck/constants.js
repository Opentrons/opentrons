// @flow

// These 'nonfillable' container types render on the deck as an image instead of Wells
export const nonFillableContainers = [
  'trash-box',
  'tiprack-10ul',
  'tiprack-200ul',
  'tiprack-1000ul',
  'tiprack-1000ul-chem'
]

// ========= OT2 DECK ===============

export const SLOTNAME_MATRIX = [ // used for deckmap
  ['10', '11', '12'],
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3']
]

export const sortedSlotnames = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

export const TRASH_SLOTNAME = '12'

// Slot dims in mm
export const SLOT_WIDTH = 127.8
export const SLOT_HEIGHT = 85.5
export const SLOT_SPACING = 5
export const DECK_WIDTH = SLOT_WIDTH * 3 + SLOT_SPACING * 4
export const DECK_HEIGHT = SLOT_HEIGHT * 4 + SLOT_SPACING * 5
