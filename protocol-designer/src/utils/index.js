// @flow
import uuidv1 from 'uuid/v1'
import { makeWellSetHelpers } from '@opentrons/shared-data'
import { i18n } from '../localization'
import type { WellGroup } from '@opentrons/components'
import type { BoundingRect, GenericRect } from '../collision-types'

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
): WellGroup => {
  // Returns set of selected wells under a collision rect
  const { x0, y0, x1, y1 } = rectPositions
  const selectionBoundingRect = {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    width: Math.abs(x1 - x0),
    height: Math.abs(y1 - y0),
  }

  // NOTE: querySelectorAll returns a NodeList, so you need to unpack it as an Array to do .filter
  const selectableElems: Array<HTMLElement> = [
    ...document.querySelectorAll('.' + selectableClassname),
  ]

  const collidedElems = selectableElems.filter((selectableElem, i) =>
    rectCollision(
      selectionBoundingRect,
      clientRectToBoundingRect(selectableElem.getBoundingClientRect())
    )
  )

  const collidedWellData = collidedElems.reduce(
    (acc: WellGroup, elem): WellGroup => {
      // TODO IMMEDIATELY no magic string 'wellname'
      if ('wellname' in elem.dataset) {
        const wellName = elem.dataset['wellname']
        return { ...acc, [wellName]: null }
      }
      return acc
    },
    {}
  )

  return collidedWellData
}

// TODO IMMEDIATELY use where appropriate
export const arrayToWellGroup = (w: Array<string>): WellGroup =>
  w.reduce((acc, wellName) => ({ ...acc, [wellName]: null }), {})

// cross-PD memoization of well set utils
export const {
  canPipetteUseLabware,
  getAllWellSetsForLabware,
  getWellSetForMultichannel,
} = makeWellSetHelpers()

export const makeTemperatureText = (temperature: number | null): string =>
  temperature === null
    ? i18n.t('modules.status.deactivated')
    : `${temperature} ${i18n.t('application.units.degrees')}`
