// @flow
import reduce from 'lodash/reduce'
import * as componentLib from '@opentrons/components'
import type {JsonWellData, WellVolumes, VolumeJson} from './types'
export const {
  // CONTAINER INFO
  defaultContainers,
  nonFillableContainers,
  // OT2 DECK CONSTANTS
  SLOTNAME_MATRIX,
  sortedSlotnames,
  TRASH_SLOTNAME,
  SLOT_WIDTH,
  SLOT_HEIGHT,
  SLOT_SPACING,
  DECK_WIDTH,
  DECK_HEIGHT,
  // STYLE CONSTANTS
  swatchColors,
  // SPECIAL SELECTORS
  SELECTABLE_WELL_CLASS
} = componentLib

export const getMaxVolumes = (containerType: string): WellVolumes => {
  const cont: VolumeJson = defaultContainers.containers[containerType]
  if (cont) {
    return reduce(
      cont.locations,
      (acc, wellData: JsonWellData, wellName): WellVolumes => ({
        ...acc,
        [wellName]: wellData['total-liquid-volume']
      }),
      {}
    )
  }
  console.warn(`Container type ${containerType} not in default-containers.json, max vol defaults to 30000`)
  return {default: 300}
}

/** All wells for labware, in arbitrary order. */
export function getAllWellsForLabware (labwareType: string): Array<string> {
  const cont: VolumeJson = defaultContainers.containers[labwareType]
  if (!cont) {
    console.error(`getAllWellsForLabware: invalid labware type "${labwareType}"`)
    return []
  }
  return Object.keys(cont.locations)
}

export const FIXED_TRASH_ID: 'trashId' = 'trashId'
