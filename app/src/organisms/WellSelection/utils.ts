import {
  INTERACTIVE_WELL_DATA_ATTRIBUTE,
  makeWellSetHelpers,
} from '@opentrons/shared-data'

import type { WellGroup } from '@opentrons/components'
import type { WellSetHelpers } from '@opentrons/shared-data'
import type { BoundingRect, GenericRect } from './types'

// Collision detection for SelectionRect / WellSelection
export const rectCollision = (
  rect1: BoundingRect,
  rect2: BoundingRect
): boolean =>
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

// TODO(jh, 07-17-24): Consider checking specific well labels instead of elementAtPoint as a more robust alternative.
export const getCollidingWells = (rectPositions: GenericRect): WellGroup => {
  const isElementVisible = (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect()
    // If multiple well elements occupy the same x,y coordinate space, document.elementFromPoint() selects
    // ONLY the "topmost" well element, accounting for z-index, stacking order, visibility, and opacity.
    const elementAtPoint = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    )
    return element.contains(elementAtPoint)
  }

  // Returns set of selected wells under a collision rect
  const { x0, y0, x1, y1 } = rectPositions
  const selectionBoundingRect = {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    width: Math.abs(x1 - x0),
    height: Math.abs(y1 - y0),
  }
  // NOTE: querySelectorAll returns a NodeList, so you need to unpack it as an Array to do .filter
  const selectableElems: HTMLElement[] = [
    ...document.querySelectorAll<HTMLElement>(
      `[${INTERACTIVE_WELL_DATA_ATTRIBUTE}]`
    ),
  ]

  const collidedElems = selectableElems.filter(selectableElem => {
    const rect = selectableElem.getBoundingClientRect()

    // Check if the element is in the viewport and not obscured.
    const isInViewport =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)

    const isVisible = isInViewport && isElementVisible(selectableElem)

    return (
      isVisible &&
      rectCollision(selectionBoundingRect, clientRectToBoundingRect(rect))
    )
  })

  const collidedWellData = collidedElems.reduce(
    (acc: WellGroup, elem): WellGroup => {
      if (
        INTERACTIVE_WELL_DATA_ATTRIBUTE.replace('data-', '') in elem.dataset
      ) {
        const wellName = elem.dataset.wellname
        return wellName != null ? { ...acc, [wellName]: null } : acc
      }

      return acc
    },
    {}
  )
  return collidedWellData
}

export const arrayToWellGroup = (w: string[]): WellGroup =>
  w.reduce((acc, wellName) => ({ ...acc, [wellName]: null }), {})

// memoization of well set utils
const wellSetHelpers: WellSetHelpers = makeWellSetHelpers()
const {
  canPipetteUseLabware,
  getAllWellSetsForLabware,
  getWellSetForMultichannel,
} = wellSetHelpers
export {
  canPipetteUseLabware,
  getAllWellSetsForLabware,
  getWellSetForMultichannel,
}
