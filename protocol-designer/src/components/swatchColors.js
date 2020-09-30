// @flow

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
