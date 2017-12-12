import reduce from 'lodash/reduce'
import { constants as componentLibConstants } from '@opentrons/components'

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
} = componentLibConstants

export const getMaxVolumes = containerType => {
  const cont = defaultContainers.containers[containerType]
  if (cont) {
    return reduce(
      cont.locations,
      (acc, wellData, wellName) => ({
        ...acc,
        [wellName]: wellData['total-liquid-volume']
      }),
      {}
    )
  }
  console.warn(`Container type ${containerType} not in default-containers.json, max vol defaults to 30000`)
  return {default: 300}
}
