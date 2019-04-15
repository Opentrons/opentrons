// @flow
import mapValues from 'lodash/mapValues'
import * as componentLib from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { WellVolumes } from './types'
// TODO Ian 2018-11-27: import these from components lib, not from this contants file
export const {
  // OT2 DECK CONSTANTS
  SLOTNAME_MATRIX,
  sortedSlotnames,
  TRASH_SLOTNAME,
  SLOT_SPACING_MM,
  // STYLE CONSTANTS
  swatchColors,
  // SPECIAL SELECTORS
  SELECTABLE_WELL_CLASS,
} = componentLib

export const getMaxVolumes = (def: LabwareDefinition2): WellVolumes =>
  mapValues(def.wells, well => well.totalLiquidVolume)

/** All wells for labware, in arbitrary order. */
export function getAllWellsForLabware(def: LabwareDefinition2): Array<string> {
  return Object.keys(def.wells)
}

export const FIXED_TRASH_ID: 'trashId' = 'trashId'

export const START_TERMINAL_TITLE = 'STARTING DECK STATE'
export const END_TERMINAL_TITLE = 'FINAL DECK STATE'

// special ID for invisible deck setup step-form
export const INITIAL_DECK_SETUP_STEP_ID = '__INITIAL_DECK_SETUP_STEP__'

export const DEFAULT_CHANGE_TIP_OPTION: 'always' = 'always'
export const DEFAULT_MM_FROM_BOTTOM_ASPIRATE = 1
export const DEFAULT_MM_FROM_BOTTOM_DISPENSE = 0.5

// NOTE: in the negative Z direction, to go down from top
export const DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP = -1

export const DEFAULT_WELL_ORDER_FIRST_OPTION: 't2b' = 't2b'
export const DEFAULT_WELL_ORDER_SECOND_OPTION: 'l2r' = 'l2r'

export const WELL_LABEL_OFFSET: number = 8
