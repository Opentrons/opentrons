export const slotnames = [
  'A3', 'B3', 'C3', 'D3', 'E3',
  'A2', 'B2', 'C2', 'D2', 'E2',
  'A1', 'B1', 'C1', 'D1', 'E1'
]

// These 'nonfillable' container types render on the deck as an image instead of Wells
export const nonFillableContainers = ['trash-box', 'tiprack-10ul', 'tiprack-200ul', 'tiprack-1000ul', 'tiprack-1000ul-chem']

// TODO wellShape not used yet
export const containerDims = containerType => {
  if (containerType.startsWith('96-')) {
    return {rows: 12, columns: 8, wellShape: 'circle'}
  }

  if (containerType.startsWith('384-')) {
    return {rows: 24, columns: 16, wellShape: 'circle'}
  }

  if (containerType.startsWith('tube-rack-')) {
    return {rows: 6, columns: 4, wellShape: 'circle'}
  }

  if (containerType === 'trough-12row') {
    return {rows: 12, columns: 1, wellShape: 'rectangle'}
  }

  // if (containerType.startsWith('PCR-strip')) {
  //   return {rows: 1, columns: 8, wellShape: 'circle'}
  // }

  // TODO: handle tipracks and trash container

  console.warn(`Warning: no container type ${containerType} not in containerDims. Defaulting to 12x8`)
  return {rows: 12, columns: 8, wellShape: 'circle'}
}

// The '.ot-selectable' classname is used to find collisions with SelectionRect
export const SELECTABLE_CLASS = 'ot-selectable'

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

export const toWellName = ({rowNum, colNum}) => (
  String.fromCharCode(colNum + 65) + (rowNum + 1)
)
