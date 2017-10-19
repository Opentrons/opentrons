export const slotnames = [
  'A3', 'B3', 'C3', 'D3', 'E3',
  'A2', 'B2', 'C2', 'D2', 'E2',
  'A1', 'B1', 'C1', 'D1', 'E1'
]

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

  if (containerType.startsWith('PCR-strip')) {
    return {rows: 1, columns: 8, wellShape: 'circle'}
  }

  // TODO: handle tipracks and trash container

  console.warn(`Warning: no container type ${containerType} not in containerDims. Defaulting to 12x8`)
  return {rows: 12, columns: 8, wellShape: 'circle'}
}

// The '.ot-selectable' classname is used to find collisions with SelectionRect
export const SELECTABLE_CLASS = 'ot-selectable'

// TODO factor into CSS or constants or elsewhere
export const swatchColors = n => {
  const colors = ['blue', 'orange', 'red', 'purple', 'green', 'yellow', 'brown', 'pink']
  return colors[n % colors.length]
}

export const toWellName = ({rowNum, colNum}) => (
  String.fromCharCode(colNum + 65) + (rowNum + 1)
)
