// @flow

// constants for dealing with robot coordinate system (eg in labwareTools)
export const SLOT_LENGTH_MM = 127.76 // along X axis in robot coordinate system
export const SLOT_WIDTH_MM = 85.48 // along Y axis in robot coordinate system

// constants for SVG renders of the deck
export const SLOT_RENDER_WIDTH = SLOT_LENGTH_MM // along X axis in SVG coords
export const SLOT_RENDER_HEIGHT = SLOT_WIDTH_MM // along Y axis in SVG coords

// taken from opentrons_1_trash_1100ml_fixed v1's dimensions
export const FIXED_TRASH_RENDER_HEIGHT = 165.86 // along Y axis in SVG coords

export const OPENTRONS_LABWARE_NAMESPACE = 'opentrons'

export const THERMOCYCLER: 'thermocycler' = 'thermocycler'

export const TEMPDECK: 'tempdeck' = 'tempdeck'

export const MAGDECK: 'magdeck' = 'magdeck'

export const ENGAGE_HEIGHT_OFFSET = -4
