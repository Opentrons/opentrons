export const humanize = s =>
  s.toLowerCase().split(/-|_|\./)
    .filter(s => s) // only truthy
    .map(substring =>
      substring[0].toUpperCase() + substring.slice(1)
    ).join(' ')

// Not really a UUID, but close enough...?
export const uuid = () => new Date().getTime() + '.' + Math.random()

export const intToAlphabetLetter = (i, lowerCase = false) =>
  String.fromCharCode((lowerCase ? 96 : 65) + i)


export const transpose = matrix => matrix[0].map((_col, i) =>
  matrix.map(row => row[i])
)

// These utils are great candidates for unit tests
export const toWellName = ({rowNum, colNum}) => (
  String.fromCharCode(colNum + 65) + (rowNum + 1)
)

export const wellKeyToXYList = wellKey => {
  const [x, y] = wellKey.split(',').map(s => parseInt(s, 10))
  return toWellName({rowNum: parseInt(y), colNum: x})
}

// Collision detection for SelectionRect / SelectablePlate

export const rectCollision = (rect1, rect2) => (
  rect1.x < rect2.x + rect2.width &&
  rect1.x + rect1.width > rect2.x &&
  rect1.y < rect2.y + rect2.height &&
  rect1.height + rect1.y > rect2.y
)

export const getCollidingWells = (rectPositions, selectableClassname) => {
  // Returns obj of selected wells under a collision rect
  // Result: {'0,1': [0, 1], '0,2': [0, 2]}] where numbers are well positions: (column, row).
  const { x0, y0, x1, y1 } = rectPositions
  const selectionBoundingRect = {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    width: Math.abs(x1 - x0),
    height: Math.abs(y1 - y0)
  }

  // NOTE: querySelectorAll returns a NodeList, so you need to unpack it as an Array to do .filter
  const selectableElems = [...document.querySelectorAll('.' + selectableClassname)]

  const collidedElems = selectableElems.filter((selectableElem, i) =>
    rectCollision(selectionBoundingRect, selectableElem.getBoundingClientRect())
  )

  const collidedWellData = collidedElems.reduce((acc, elem) => {
    if ('wellX' in elem.dataset && 'wellY' in elem.dataset) {
      const wellX = elem.dataset['wellX']
      const wellY = elem.dataset['wellY']
      const wellKey = wellX + ',' + wellY
      return {...acc, [wellKey]: [parseInt(wellX), parseInt(wellY)]}
    }
    return acc
  }, {})

  return collidedWellData
}
