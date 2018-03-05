// @flow
import * as componentLibrary from '@opentrons/components'

export const { humanize, wellNameSplit } = componentLibrary

export type FormConnectorFactory<F> = (
  handleChange: (accessor: F) => (e: SyntheticInputEvent<*>) => mixed,
  formData: F
) => FormConnector<F>

export type FormConnector<F> = (accessor: $Keys<F>) =>
  {onChange: (e: SyntheticInputEvent<*>) => mixed, value: $Values<F>}

export const formConnectorFactory = (
  handleChange: (accessor: string) => (e: SyntheticInputEvent<*>) => mixed,
  formData: Object
): FormConnector<*> => (accessor: string) => ({
  // Uses single accessor string to pass onChange & value into form fields
  // TODO Ian 2018-02-07 type error when accessor not valid ('string' is too general)
  onChange: handleChange(accessor),
  value: formData[accessor] || ''
})

// Not really a UUID, but close enough...?
export const uuid = () => new Date().getTime() + '.' + Math.random()

export const intToAlphabetLetter = (i: number, lowerCase: boolean = false) =>
  String.fromCharCode((lowerCase ? 96 : 65) + i)

export const transpose = (matrix: Array<Array<any>>) => matrix[0].map((_col, i) =>
  matrix.map(row => row[i])
)

// These utils are great candidates for unit tests
export const toWellName = ({rowNum, colNum}: {rowNum: number, colNum: number}) => (
  String.fromCharCode(colNum + 65) + (rowNum + 1)
)

export const wellKeyToXYList = (wellKey: string) => {
  const [x, y] = wellKey.split(',').map(s => parseInt(s, 10))
  return toWellName({rowNum: parseInt(y), colNum: x})
}

export const wellNameToXY = (wellName: string) => {
  // Eg B9 => [1, 8]
  const [letters, numbers] = wellNameSplit(wellName)

  const letterNum = letters.toUpperCase().charCodeAt(0) - 65
  const numberNum = parseInt(numbers, 10) - 1
  return [letterNum, numberNum]
}

// Collision detection for SelectionRect / SelectablePlate

type Rect = {x: number, y: number, width: number, height: number}

export const rectCollision = (rect1: Rect, rect2: any) => ( // TODO rect2 should be Rect. But the getBoundingClientRect doesn't always return x/y https://github.com/facebook/flow/issues/5357
  rect1.x < rect2.x + rect2.width &&
  rect1.x + rect1.width > rect2.x &&
  rect1.y < rect2.y + rect2.height &&
  rect1.height + rect1.y > rect2.y
)

type RectPositions = {x0: number, y0: number, x1: number, y1: number}
export const getCollidingWells = (rectPositions: RectPositions, selectableClassname: string) => {
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
    if ('wellname' in elem.dataset) {
      const wellName = elem.dataset['wellname']
      return {...acc, [wellName]: wellName}
    }
    return acc
  }, {})

  return collidedWellData
}
