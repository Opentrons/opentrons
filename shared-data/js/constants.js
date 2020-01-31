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

// TODO: IL 2019-01-31 these 3 are module MODELS. They should be derived from the module definition file.
// We should ensure we're not using them as if they were types.
export const THERMOCYCLER: 'thermocycler' = 'thermocycler'
export const TEMPDECK: 'tempdeck' = 'tempdeck'
export const MAGDECK: 'magdeck' = 'magdeck'

// NOTE: these are NOT module MODELs, they are `moduleType`s. Should match ENUM in module definition file.
export const TEMPERATURE_MODULE_TYPE: 'temperatureModuleType' =
  'temperatureModuleType'
export const MAGNETIC_MODULE_TYPE: 'magneticModuleType' = 'magneticModuleType'
export const THERMOCYCLER_MODULE_TYPE: 'thermocyclerModuleType' =
  'thermocyclerModuleType'
// offset added to parameters.magneticModuleEngageHeight for displaying reccomended height in PD
export const ENGAGE_HEIGHT_OFFSET = -4
