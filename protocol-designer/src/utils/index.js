// @flow
import uuidv1 from 'uuid/v1'
import type { BoundingRect, GenericRect } from '../collision-types'
import type { Wells } from '../labware-ingred/types'

export const registerSelectors =
  process.env.NODE_ENV === 'development'
    ? require('reselect-tools').registerSelectors
    : (a: any) => {}

export const uuid: () => string = uuidv1

// Collision detection for SelectionRect / SelectableLabware

export const rectCollision = (rect1: BoundingRect, rect2: BoundingRect) =>
  rect1.x < rect2.x + rect2.width &&
  rect1.x + rect1.width > rect2.x &&
  rect1.y < rect2.y + rect2.height &&
  rect1.height + rect1.y > rect2.y

export function clientRectToBoundingRect(rect: ClientRect): BoundingRect {
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  }
}

export const getCollidingWells = (
  rectPositions: GenericRect,
  selectableClassname: string
): Wells => {
  // Returns obj of selected wells under a collision rect
  // Result: {'0,1': [0, 1], '0,2': [0, 2]}] where numbers are well positions: (column, row).
  const { x0, y0, x1, y1 } = rectPositions
  const selectionBoundingRect = {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    width: Math.abs(x1 - x0),
    height: Math.abs(y1 - y0),
  }

  // NOTE: querySelectorAll returns a NodeList, so you need to unpack it as an Array to do .filter
  const selectableElems = [
    ...document.querySelectorAll('.' + selectableClassname),
  ]

  const collidedElems = selectableElems.filter((selectableElem, i) =>
    rectCollision(
      selectionBoundingRect,
      clientRectToBoundingRect(selectableElem.getBoundingClientRect())
    )
  )

  const collidedWellData = collidedElems.reduce((acc: Wells, elem) => {
    if ('wellname' in elem.dataset) {
      const wellName = elem.dataset['wellname']
      return { ...acc, [wellName]: wellName }
    }
    return acc
  }, {})

  return collidedWellData
}
