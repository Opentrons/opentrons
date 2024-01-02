import * as React from 'react'
import type { DeckDefinition, DeckSlot } from '@opentrons/shared-data'

export interface RobotCoordinateSpaceWithDOMCoordsRenderProps {
  deckSlotsById: { [slotId: string]: DeckSlot }
  getRobotCoordsFromDOMCoords: (
    domX: number,
    domY: number
  ) => { x: number; y: number }
}

interface RobotCoordinateSpaceWithDOMCoordsProps {
  viewBox?: string | null
  deckDef?: DeckDefinition
  children?: (
    props: RobotCoordinateSpaceWithDOMCoordsRenderProps
  ) => React.ReactNode
}

type GetRobotCoordsFromDOMCoords = RobotCoordinateSpaceWithDOMCoordsRenderProps['getRobotCoordsFromDOMCoords']

export function RobotCoordinateSpaceWithDOMCoords(
  props: RobotCoordinateSpaceWithDOMCoordsProps
): JSX.Element | null {
  const { children, deckDef, viewBox, ...restProps } = props
  const wrapperRef = React.useRef<SVGSVGElement>(null)
  const getRobotCoordsFromDOMCoords: GetRobotCoordsFromDOMCoords = (x, y) => {
    if (wrapperRef.current == null) return { x: 0, y: 0 }

    const cursorPoint = wrapperRef.current.createSVGPoint()

    cursorPoint.x = x
    cursorPoint.y = y

    return cursorPoint.matrixTransform(
      wrapperRef.current.getScreenCTM()?.inverse()
    )
  }
  if (deckDef == null && viewBox == null) return null

  let wholeDeckViewBox
  let deckSlotsById = {}
  if (deckDef != null) {
    const [viewBoxOriginX, viewBoxOriginY] = deckDef.cornerOffsetFromOrigin
    const [deckXDimension, deckYDimension] = deckDef.dimensions

    deckSlotsById = deckDef.locations.addressableAreas.reduce(
      (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
      {}
    )
    wholeDeckViewBox = `${viewBoxOriginX} ${viewBoxOriginY} ${deckXDimension} ${deckYDimension}`
  }
  return (
    <svg
      viewBox={viewBox || wholeDeckViewBox}
      ref={wrapperRef}
      transform="scale(1, -1)"
      {...restProps}
    >
      {children?.({ deckSlotsById, getRobotCoordsFromDOMCoords })}
    </svg>
  )
}
