
import { makeWellSetHelpers } from "@opentrons/shared-data"
import type { WellGroup } from "@opentrons/components"
import type { WellSetHelpers } from "@opentrons/shared-data"
import { BoundingRect, GenericRect } from "./types"
import { INTERACTIVE_WELL_DATA_ATTRIBUTE } from "@opentrons/components/src/hardware-sim/Labware/labwareInternals/Well"

export const arrayToWellGroup = (w: string[]): WellGroup =>
  w.reduce((acc, wellName) => ({ ...acc, [wellName]: null }), {})
// cross-PD memoization of well set utils
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
export const makeTemperatureText = (
  temperature: number | string | null,
  t: any
): string =>
  temperature === null
    ? t('modules:status.deactivated')
    : `${temperature} ${t('application:units.degrees')}`
export const makeLidLabelText = (lidOpen: boolean, t: any): string =>
  t(`modules:lid_label`, {
    lidStatus: t(lidOpen ? 'modules:lid_open' : 'modules:lid_closed'),
  })


// Collision detection for SelectionRect / SelectableLabware
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

export const getCollidingWells = (rectPositions: GenericRect): WellGroup => {
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
  const collidedElems = selectableElems.filter((selectableElem, i) =>
    rectCollision(
      selectionBoundingRect,
      clientRectToBoundingRect(selectableElem.getBoundingClientRect())
    )
  )
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