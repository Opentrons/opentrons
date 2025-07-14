import mapValues from 'lodash/mapValues'

import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import type {
  CutoutId,
  LabwareDefinition2,
  RobotType,
} from '@opentrons/shared-data'
import type { WellVolumes } from './types'

export const getMaxVolumes = (def: LabwareDefinition2): WellVolumes =>
  mapValues(def.wells, well => well.totalLiquidVolume)

export const FIXED_TRASH_ID: 'fixedTrash' = 'fixedTrash'
// Standard slot dims FOR VISUALIZATION ONLY
export const STD_SLOT_X_DIM = 128
export const STD_SLOT_Y_DIM = 86
export const STD_SLOT_DIVIDER_WIDTH = 4
export const START_TERMINAL_TITLE = 'STARTING DECK STATE'
export const END_TERMINAL_TITLE = 'FINAL DECK STATE'
export const WASTE_CHUTE_DISPLAY_NAME = 'Waste chute'
export const TRASH_BIN_DISPLAY_NAME = 'Trash bin'
// special ID for invisible deck setup step-form
export const INITIAL_DECK_SETUP_STEP_ID = '__INITIAL_DECK_SETUP_STEP__'
export const DEFAULT_CHANGE_TIP_OPTION: 'always' = 'always'
export const DEFAULT_MM_OFFSET_FROM_BOTTOM = 1
// NOTE: in the negative Z direction, to go down from top
export const DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP = -1
export const DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_EDGE = 0
export const DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP = 0
export const DEFAULT_DELAY_SECONDS = 1
export const DEFAULT_WELL_ORDER_FIRST_OPTION: 't2b' = 't2b'
export const DEFAULT_WELL_ORDER_SECOND_OPTION: 'l2r' = 'l2r'
export const MIN_ENGAGE_HEIGHT_V1 = 0
export const MAX_ENGAGE_HEIGHT_V1 = 45
export const MIN_ENGAGE_HEIGHT_V2 = -2.5
export const MAX_ENGAGE_HEIGHT_V2 = 25
export const MIN_TEMP_MODULE_TEMP = 4
export const MAX_TEMP_MODULE_TEMP = 95
export const MIN_HEATER_SHAKER_MODULE_TEMP = 37
export const MAX_HEATER_SHAKER_MODULE_TEMP = 95
export const MIN_HEATER_SHAKER_MODULE_RPM = 200
export const MAX_HEATER_SHAKER_MODULE_RPM = 3000
export const MIN_HEATER_SHAKER_DURATION_SECONDS = 0
export const MAX_HEATER_SHAKER_DURATION_SECONDS = 60
export const MIN_TC_BLOCK_TEMP = 4
export const MAX_TC_BLOCK_TEMP = 99
export const MIN_TC_LID_TEMP = 37
export const MAX_TC_LID_TEMP = 110
export const MIN_TC_DURATION_SECONDS = 0
export const MAX_TC_DURATION_SECONDS = 60
export const MIN_TC_PROFILE_VOLUME = 0
export const MAX_TC_PROFILE_VOLUME = 100

// Values for pauseAction field
export const PAUSE_UNTIL_RESUME: 'untilResume' = 'untilResume'
export const PAUSE_UNTIL_TIME: 'untilTime' = 'untilTime'
export const PAUSE_UNTIL_TEMP: 'untilTemperature' = 'untilTemperature'
export const DND_TYPES = {
  LABWARE: 'LABWARE',
  STEP_ITEM: 'STEP_ITEM',
}
// Values for TC fields
export const THERMOCYCLER_STATE: 'thermocyclerState' = 'thermocyclerState'
export const THERMOCYCLER_PROFILE: 'thermocyclerProfile' = 'thermocyclerProfile'
// Priority for fixtures
export const STAGING_AREA_CUTOUTS_ORDERED: CutoutId[] = [
  'cutoutB3',
  'cutoutC3',
  'cutoutD3',
  'cutoutA3',
]

// Values for absorbance reader
export const ABSORBANCE_READER_INITIALIZE_MODE_SINGLE = 'single'
export const ABSORBANCE_READER_INITIALIZE_MODE_MULTI = 'multi'
export const ABSORBANCE_READER_INITIALIZE: 'absorbanceReaderInitialize' =
  'absorbanceReaderInitialize'
export const ABSORBANCE_READER_READ: 'absorbanceReaderRead' =
  'absorbanceReaderRead'
export const ABSORBANCE_READER_LID: 'absorbanceReaderLid' =
  'absorbanceReaderLid'
export const ABSORBANCE_READER_MIN_WAVELENGTH_NM = 350
export const ABSORBANCE_READER_MAX_WAVELENGTH_NM = 1000
export const ABSORBANCE_READER_COLOR_BY_WAVELENGTH: Record<number, string> = {
  450: 'Blue',
  562: 'Green',
  600: 'Orange',
  650: 'Red',
}

export const OFFDECK: 'offDeck' = 'offDeck'

export const PROTOCOL_DESIGNER_SOURCE: 'Protocol Designer' = 'Protocol Designer' // protocolSource for tracking analytics in the app

export const DECK_SETUP_TOOLS_WIDTH_REM = 21.875
export const OVERFLOW_MENU_POSITION_ADJUSTMENT = 4

// Below values copied from opentrons/api/src/opentrons/config/defaults_ot[2/3].py
export const FLEX_X_Y_MAX_SPEED = 300
export const FLEX_LOW_THROUGHPUT_Z_MAX_SPEED = 100
export const FLEX_HIGH_THROUGHPUT_Z_MAX_SPEED = 35
export const FLEX_LOW_THROUGHPUT_PLUNGER_MAX_SPEED = 70
export const FLEX_HIGH_THROUGHPUT_PLUNGER_MAX_SPEED = 15
export const OT2_X_MAX_SPEED = 600
export const OT2_Y_MAX_SPEED = 400
export const OT2_Z_MAX_SPEED = 125
export const OT2_PLUNGER_MAX_SPEED = 40

export const CHANNELS_MAPPED_TO_MAX_SPEED: Record<
  RobotType,
  Record<number, { plunger: number; x: number; y: number; z: number }>
> = {
  [FLEX_ROBOT_TYPE]: {
    1: {
      plunger: FLEX_LOW_THROUGHPUT_PLUNGER_MAX_SPEED,
      x: FLEX_X_Y_MAX_SPEED,
      y: FLEX_X_Y_MAX_SPEED,
      z: FLEX_LOW_THROUGHPUT_Z_MAX_SPEED,
    },
    8: {
      plunger: FLEX_LOW_THROUGHPUT_PLUNGER_MAX_SPEED,
      x: FLEX_X_Y_MAX_SPEED,
      y: FLEX_X_Y_MAX_SPEED,
      z: FLEX_LOW_THROUGHPUT_Z_MAX_SPEED,
    },
    96: {
      plunger: FLEX_HIGH_THROUGHPUT_PLUNGER_MAX_SPEED,
      x: FLEX_X_Y_MAX_SPEED,
      y: FLEX_X_Y_MAX_SPEED,
      z: FLEX_HIGH_THROUGHPUT_Z_MAX_SPEED,
    },
  },
  [OT2_ROBOT_TYPE]: {
    1: {
      plunger: OT2_PLUNGER_MAX_SPEED,
      x: OT2_X_MAX_SPEED,
      y: OT2_Y_MAX_SPEED,
      z: OT2_Z_MAX_SPEED,
    },
    8: {
      plunger: OT2_PLUNGER_MAX_SPEED,
      x: OT2_X_MAX_SPEED,
      y: OT2_Y_MAX_SPEED,
      z: OT2_Z_MAX_SPEED,
    },
  },
}

export const MINIMUM_LIQUID_CLASS_VOLUME = 1
