import { useRef } from 'react'

import { Svg } from '../../primitives'

import type { ComponentProps, ReactNode } from 'react'
import type { DeckDefinition, DeckSlot } from '@opentrons/shared-data'

export interface RobotCoordinateSpaceWithRefRenderProps {
  deckSlotsById: { [slotId: string]: DeckSlot }
}

interface RobotCoordinateSpaceWithRefProps extends ComponentProps<typeof Svg> {
  viewBox?: string | null
  deckDef?: DeckDefinition
  zoomed?: boolean
  adjustViewboxForStacker?: boolean
  children?: (props: RobotCoordinateSpaceWithRefRenderProps) => ReactNode
}

// manual visual adjustments for flex stacker deck view to fit properly and
// in the center of the frame
const STACKER_VIEWBOX_ADJUSTMENTS = {
  viewBoxOriginX: 260,
  viewBoxOriginY: -25,
  deckXDimension: -255,
  deckYDimension: 105,
}

export function RobotCoordinateSpaceWithRef(
  props: RobotCoordinateSpaceWithRefProps
): JSX.Element | null {
  const {
    children,
    deckDef,
    viewBox,
    adjustViewBoxForStacker = false,
    zoomed = false,
    ...restProps
  } = props
  const wrapperRef = useRef<SVGSVGElement>(null)

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
    wholeDeckViewBox = adjustViewBoxForStacker
      ? `${viewBoxOriginX + STACKER_VIEWBOX_ADJUSTMENTS.viewBoxOriginX} ${viewBoxOriginY + STACKER_VIEWBOX_ADJUSTMENTS.viewBoxOriginY} ${deckXDimension + STACKER_VIEWBOX_ADJUSTMENTS.deckXDimension} ${deckYDimension + STACKER_VIEWBOX_ADJUSTMENTS.deckYDimension}`
      : `${viewBoxOriginX} ${viewBoxOriginY} ${deckXDimension} ${deckYDimension}`
  }

  return (
    <Svg
      viewBox={zoomed ? viewBox : wholeDeckViewBox}
      ref={wrapperRef}
      transform="scale(1, -1)"
      width="100%"
      height="100%"
      {...restProps}
    >
      {children?.({ deckSlotsById })}
    </Svg>
  )
}
