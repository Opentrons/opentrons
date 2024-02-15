import * as React from 'react'
import { Svg } from '../../primitives'
import type { DeckDefinition, DeckSlot } from '@opentrons/shared-data'

export interface RobotCoordinateSpaceWithDOMCoordsRenderProps {
  deckSlotsById: { [slotId: string]: DeckSlot }
}

interface RobotCoordinateSpaceWithDOMCoordsProps
  extends React.ComponentProps<typeof Svg> {
  viewBox?: string | null
  deckDef?: DeckDefinition
  children?: (
    props: RobotCoordinateSpaceWithDOMCoordsRenderProps
  ) => React.ReactNode
}

export function RobotCoordinateSpaceWithDOMCoords(
  props: RobotCoordinateSpaceWithDOMCoordsProps
): JSX.Element | null {
  const { children, deckDef, viewBox, ...restProps } = props
  const wrapperRef = React.useRef<SVGSVGElement>(null)

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
    <Svg
      viewBox={viewBox || wholeDeckViewBox}
      ref={wrapperRef}
      transform="scale(1, -1)"
      {...restProps}
    >
      {children?.({ deckSlotsById })}
    </Svg>
  )
}
