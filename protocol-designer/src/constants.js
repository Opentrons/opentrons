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
  SLOT_WIDTH,
  SLOT_HEIGHT,
  SLOT_SPACING,
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
