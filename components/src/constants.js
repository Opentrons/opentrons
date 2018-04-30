// @flow

// ========= STYLE ================

export const MIXED_WELL_COLOR = '#9b9b9b' // NOTE: matches `--c-med-gray` in colors.css

// TODO factor into CSS or constants or elsewhere
export const swatchColors = (n: number) => {
  const colors = [
    '#0076ff',
    '#ff4888',
    '#00d781',
    '#7b21d6',
    '#ff6161',
    '#065596',
    '#2a97dc',
    '#d24193'
  ]
  return colors[n % colors.length]
}

// ========= SPECIAL SELECTORS ========

// This classname is used to find collisions with SelectionRect in Protocol Designer
export const SELECTABLE_WELL_CLASS = 'ot-selectable-well'
// ^^^ TODO Ian 2017-12-18: use a data- attribute instead of a class, and factor this out,
// probably into SelectionRect which isn't in complib yet
