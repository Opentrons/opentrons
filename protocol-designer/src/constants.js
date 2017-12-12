import reduce from 'lodash/reduce'
import defaultContainers from './default-containers.json'
import { constants as componentLibConstants } from '@opentrons/components'

export { defaultContainers }

export const {
  SLOTNAME_MATRIX,
  sortedSlotnames,
  TRASH_SLOTNAME,
  SLOT_WIDTH,
  SLOT_HEIGHT,
  SLOT_SPACING,
  DECK_WIDTH,
  DECK_HEIGHT,
  nonFillableContainers
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

// The '.ot-selectable' classname is used to find collisions with SelectionRect
export const SELECTABLE_WELL_CLASS = 'ot-selectable-well'

// TODO factor into CSS or constants or elsewhere
export const swatchColors = n => {
  const colors = [
    '#e6194b',
    '#3cb44b',
    '#ffe119',
    '#0082c8',
    '#f58231',
    '#911eb4',
    '#46f0f0',
    '#f032e6',
    '#d2f53c',
    '#fabebe',
    '#008080',
    '#e6beff',
    '#aa6e28',
    '#fffac8',
    '#800000',
    '#aaffc3',
    '#808000',
    '#ffd8b1',
    '#000080',
    '#808080',
    '#000000'
  ]
  return colors[n % colors.length]
}
