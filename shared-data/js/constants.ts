import type { ModuleType } from './types'

// constants for dealing with robot coordinate system (eg in labwareTools)
export const SLOT_LENGTH_MM = 127.76 // along X axis in robot coordinate system

export const SLOT_WIDTH_MM = 85.48 // along Y axis in robot coordinate system

// constants for SVG renders of the deck
export const SLOT_RENDER_WIDTH = SLOT_LENGTH_MM // along X axis in SVG coords

export const SLOT_RENDER_HEIGHT = SLOT_WIDTH_MM // along Y axis in SVG coords

// taken from opentrons_1_trash_1100ml_fixed v1's dimensions
export const FIXED_TRASH_RENDER_HEIGHT = 165.86 // along Y axis in SVG coords

// used for module visualization, remove this when we start using actual module dimensions
export const STD_SLOT_X_DIM = 128
export const STD_SLOT_Y_DIM = 86
export const STD_SLOT_DIVIDER_WIDTH = 4

export const OPENTRONS_LABWARE_NAMESPACE = 'opentrons'
export const FIXED_TRASH_ID = 'fixedTrash'

// TODO: IL 2020-02-19 These 3 constants are DEPRECATED because they're ambiguous model vs type.
export const THERMOCYCLER: 'thermocycler' = 'thermocycler'
export const TEMPDECK: 'tempdeck' = 'tempdeck'
export const MAGDECK: 'magdeck' = 'magdeck'

// these are the Module Def Schema v2 equivalents of the above. They should match the names of JSON definitions
// in shared-data/module/definitions/2.
export const MAGNETIC_MODULE_V1: 'magneticModuleV1' = 'magneticModuleV1'
export const MAGNETIC_MODULE_V2: 'magneticModuleV2' = 'magneticModuleV2'
export const TEMPERATURE_MODULE_V1: 'temperatureModuleV1' =
  'temperatureModuleV1'
export const TEMPERATURE_MODULE_V2: 'temperatureModuleV2' =
  'temperatureModuleV2'
export const THERMOCYCLER_MODULE_V1: 'thermocyclerModuleV1' =
  'thermocyclerModuleV1'
export const THERMOCYCLER_MODULE_V2: 'thermocyclerModuleV2' =
  'thermocyclerModuleV2'
export const HEATERSHAKER_MODULE_V1: 'heaterShakerModuleV1' =
  'heaterShakerModuleV1'

export const MAGNETIC_BLOCK_V1: 'magneticBlockV1' = 'magneticBlockV1'

export const GRIPPER_V1: 'gripperV1' = 'gripperV1'
export const GRIPPER_V1_1: 'gripperV1.1' = 'gripperV1.1'
export const GRIPPER_V1_2: 'gripperV1.2' = 'gripperV1.2'
export const GRIPPER_MODELS = [GRIPPER_V1, GRIPPER_V1_1, GRIPPER_V1_2]

// pipette display categories
export const FLEX: 'FLEX' = 'FLEX'
export const GEN2: 'GEN2' = 'GEN2'
export const GEN1: 'GEN1' = 'GEN1'

// pipette mounts
export const LEFT: 'left' = 'left'
export const RIGHT: 'right' = 'right'
export const EXTENSION: 'extension' = 'extension'

// fake slot that PD uses to represent the slot the thermocycler sits in
export const SPAN7_8_10_11_SLOT: 'span7_8_10_11' = 'span7_8_10_11'

// NOTE: these are NOT module MODELs, they are `moduleType`s. Should match ENUM in module definition file.
export const TEMPERATURE_MODULE_TYPE: 'temperatureModuleType' =
  'temperatureModuleType'
export const MAGNETIC_MODULE_TYPE: 'magneticModuleType' = 'magneticModuleType'
export const THERMOCYCLER_MODULE_TYPE: 'thermocyclerModuleType' =
  'thermocyclerModuleType'
export const HEATERSHAKER_MODULE_TYPE: 'heaterShakerModuleType' =
  'heaterShakerModuleType'
export const MAGNETIC_BLOCK_TYPE: 'magneticBlockType' = 'magneticBlockType'

export const MAGNETIC_MODULE_MODELS = [MAGNETIC_MODULE_V1, MAGNETIC_MODULE_V2]

export const NON_CONNECTING_MODULE_TYPES: ModuleType[] = [MAGNETIC_BLOCK_TYPE]

export const TEMPERATURE_MODULE_MODELS = [
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
]

export const THERMOCYCLER_MODULE_MODELS = [
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
]

export const HEATERSHAKER_MODULE_MODELS = [HEATERSHAKER_MODULE_V1]

export const MAGNETIC_BLOCK_MODELS = [MAGNETIC_BLOCK_V1]

export const MODULE_MODELS = [
  ...MAGNETIC_MODULE_MODELS,
  ...TEMPERATURE_MODULE_MODELS,
  ...THERMOCYCLER_MODULE_MODELS,
  ...HEATERSHAKER_MODULE_MODELS,
  ...MAGNETIC_BLOCK_MODELS,
]

export const MODULE_TYPES = [
  TEMPERATURE_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
]

export const GEN_ONE_MULTI_PIPETTES = ['p10_multi', 'p50_multi', 'p300_multi']

export const IDENTITY_VECTOR = { x: 0, y: 0, z: 0 }

export const ROBOT_MODELS = ['OT-2 Standard', 'OT-3 Standard']
export const OT2_ROBOT_TYPE = 'OT-2 Standard' as const
export const FLEX_ROBOT_TYPE = 'OT-3 Standard' as const

//  TODO(jr, 7/13/23): rename this constant to FLEX_PIPETTES
export const OT3_PIPETTES = [
  'p300_single_flex',
  'p1000_single_flex',
  'p20_single_flex',
  'p50_single_flex',
  'p50_multi_flex',
  'p1000_multi_flex',
  'p1000_96',
]
export const OT2_PIPETTES = [
  'p300_single',
  'p300_multi',
  'p300_single_gen2',
  'p300_multi_gen2',
  'p1000_single',
  'p1000_single_gen2',
  'p20_single_gen2',
  'p20_multi_gen2',
  'p50_single',
  'p50_multi',
  'p10_single',
  'p10_multi',
]

//  magnetic module info
export const MM: 'mm' = 'mm'
export const MAGNETIC_MODULES_MAX_ENGAGE_HEIGHT = 20
export const MAGNETIC_MODULE_V2_DISNEGAGED_HEIGHT = -2.5 //  TODO(jr, 6/14/22): change this to -4 when ticket #9585 merges
export const MAGNETIC_MODULE_V1_DISNEGAGED_HEIGHT = -2.5

export const MAGNETIC_MODULE_TYPE_LABWARE_BOTTOM_HEIGHT = 0

export const CELSIUS: '°C' = '°C'
export const TEMP_MIN = 4
export const TEMP_MAX = 96
export const TEMP_BLOCK_MAX = 99
export const TEMP_LID_MIN = 37
export const TEMP_LID_MAX = 110
export const HS_TEMP_MIN = 37
export const HS_TEMP_MAX = 95
export const MICRO_LITERS = 'µL'

// Heater shaker module info
export const RPM: 'RPM' = 'RPM'
export const HS_RPM_MIN = 200
export const HS_RPM_MAX = 3000
export const TOO_HOT_TEMP = 48.9
export const MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM = 53

export const OT2_STANDARD_MODEL: 'OT-2 Standard' = 'OT-2 Standard'
export const OT2_STANDARD_DECKID: 'ot2_standard' = 'ot2_standard'
export const FLEX_STANDARD_MODEL: 'OT-3 Standard' = 'OT-3 Standard'
export const FLEX_STANDARD_DECKID: 'ot3_standard' = 'ot3_standard'

export const SINGLE_CHANNEL: 'Single-Channel' = 'Single-Channel'
export const EIGHT_CHANNEL: '8-Channel' = '8-Channel'
export const NINETY_SIX_CHANNEL: '96-Channel' = '96-Channel'
export const SINGLE_MOUNT_PIPETTES: 'Single-Channel_and_8-Channel' =
  'Single-Channel_and_8-Channel'

// Thermocycler module info
export const TC_MODULE_LOCATION_OT2: '7,8,10,11' = '7,8,10,11'
export const TC_MODULE_LOCATION_OT3: 'A1+B1' = 'A1+B1'

export const WEIGHT_OF_96_CHANNEL: '~10kg' = '~10kg'
