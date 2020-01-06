// @flow
// common constants

export { MAGDECK, TEMPDECK, THERMOCYCLER } from '@opentrons/shared-data'

// ========= STYLE ================

export const AIR = '__air__'
export const MIXED_WELL_COLOR = '#9b9b9b' // NOTE: matches `--c-med-gray` in colors.css

// TODO factor into CSS or constants or elsewhere
export const swatchColors = (n: number): string => {
  const colors = [
    '#00d781',
    '#0076ff',
    '#ff4888',
    '#7b21d6',
    '#ff6161',
    '#065596',
    '#2a97dc',
    '#d24193',
  ]
  if (!Number.isInteger(n)) {
    // TODO: Ian 2018-07-20 use assert
    console.warn(`swatchColors expected an integer, got ${n}`)
  }
  return colors[n % colors.length]
}

// ========= SPECIAL SELECTORS ========

// This classname is used to find collisions with SelectionRect in Protocol Designer
export const SELECTABLE_WELL_CLASS = 'ot-selectable-well'
// ^^^ TODO Ian 2017-12-18: use a data- attribute instead of a class, and factor this out,
// probably into SelectionRect which isn't in complib yet
