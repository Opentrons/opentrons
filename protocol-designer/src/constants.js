// @flow
import reduce from 'lodash/reduce'
import * as componentLib from '@opentrons/components'
import {getLabware} from '@opentrons/shared-data'
import type {JsonWellData, WellVolumes} from './types'
export const {
  // OT2 DECK CONSTANTS
  SLOTNAME_MATRIX,
  sortedSlotnames,
  TRASH_SLOTNAME,
  SLOT_WIDTH_MM,
  SLOT_HEIGHT_MM,
  SLOT_SPACING_MM,
  // STYLE CONSTANTS
  swatchColors,
  // SPECIAL SELECTORS
  SELECTABLE_WELL_CLASS
} = componentLib

export const getMaxVolumes = (labwareType: string): WellVolumes => {
  const labware = getLabware(labwareType)
  if (labware) {
    return reduce(
      labware.wells,
      (acc, wellData: JsonWellData, wellName): WellVolumes => ({
        ...acc,
        [wellName]: wellData['total-liquid-volume']
      }),
      {}
    )
  }
  console.warn(`Container type ${labwareType} not in labware definitions, couldn't get max volume`)
  return {}
}

/** All wells for labware, in arbitrary order. */
export function getAllWellsForLabware (labwareType: string): Array<string> {
  const labware = getLabware(labwareType)
  if (!labware) {
    console.error(`getAllWellsForLabware: invalid labware type "${labwareType}"`)
    return []
  }
  return Object.keys(labware.wells)
}

export const FIXED_TRASH_ID: 'trashId' = 'trashId'

export const START_TERMINAL_TITLE = 'STARTING DECK STATE'
export const END_TERMINAL_TITLE = 'FINAL DECK STATE'

export const DEFAULT_CHANGE_TIP_OPTION: 'always' = 'always'
export const DEFAULT_TIP_POSITION: 0 = 0
export const DEFAULT_WELL_ORDER_FIRST_OPTION: 't2b' = 't2b'
export const DEFAULT_WELL_ORDER_SECOND_OPTION: 'l2r' = 'l2r'
