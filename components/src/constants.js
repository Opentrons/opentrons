// @flow

// ========= STYLE ================

export const MIXED_WELL_COLOR = '#9b9b9b' // NOTE: matches `--c-med-gray` in colors.css

// TODO factor into CSS or constants or elsewhere
export const swatchColors = (n: number) => {
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

// ========= SPECIAL SELECTORS ========

// This classname is used to find collisions with SelectionRect in Protocol Designer
export const SELECTABLE_WELL_CLASS = 'ot-selectable-well'
// ^^^ TODO Ian 2017-12-18: use a data- attribute instead of a class, and factor this out,
// probably into SelectionRect which isn't in complib yet
