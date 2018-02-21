// @flow
import reduce from 'lodash/reduce'
import * as componentLib from '@opentrons/components'

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

type WellVolumes = {[wellName: string]: number}
// TODO LATER Ian 2018-02-19 type for containers.json
type WellData = {
  'total-liquid-volume': number
  // missing rest of fields, todo later
}
type VolumeJson = {
  locations: {
    [wellName: string]: WellData
  }
}

export const getMaxVolumes = (containerType: string): WellVolumes => {
  const cont: VolumeJson = defaultContainers.containers[containerType]
  if (cont) {
    return reduce(
      cont.locations,
      (acc, wellData: WellData, wellName): WellVolumes => ({
        ...acc,
        [wellName]: wellData['total-liquid-volume']
      }),
      {}
    )
  }
  console.warn(`Container type ${containerType} not in default-containers.json, max vol defaults to 30000`)
  return {default: 300}
}
