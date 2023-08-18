import * as React from 'react'
import { StyleProps, Svg } from '../../primitives'
import { StyledDeck } from './StyledDeck'

import type { DeckDefinition, DeckSlot } from '@opentrons/shared-data'
import type { TrashSlotName } from './FlexTrash'

export interface RobotWorkSpaceRenderProps {
  deckSlotsById: { [slotId: string]: DeckSlot }
  getRobotCoordsFromDOMCoords: (
    domX: number,
    domY: number
  ) => { x: number; y: number }
}

export interface RobotWorkSpaceProps extends StyleProps {
  deckDef?: DeckDefinition
  viewBox?: string | null
  children?: (props: RobotWorkSpaceRenderProps) => React.ReactNode
  deckFill?: string
  deckLayerBlocklist?: string[]
  trashSlotName?: TrashSlotName
  id?: string
}

type GetRobotCoordsFromDOMCoords = RobotWorkSpaceRenderProps['getRobotCoordsFromDOMCoords']

export function RobotWorkSpace(props: RobotWorkSpaceProps): JSX.Element | null {
  const {
    children,
    deckDef,
    deckFill = '#CCCCCC',
    deckLayerBlocklist = [],
    trashSlotName,
    viewBox,
    id,
    ...styleProps
  } = props
  const wrapperRef = React.useRef<SVGSVGElement>(null)

  // NOTE: getScreenCTM in Chrome a DOMMatrix type,
  // in Firefox the same fn returns a deprecated SVGMatrix.
  // Until Firefox fixes this and conforms to SVG2 draft,
  // it will suffer from inverted y behavior (ignores css transform)
  const getRobotCoordsFromDOMCoords: GetRobotCoordsFromDOMCoords = (x, y) => {
    if (!wrapperRef.current) return { x: 0, y: 0 }

    const cursorPoint = wrapperRef.current.createSVGPoint()

    cursorPoint.x = x
    cursorPoint.y = y

    return cursorPoint.matrixTransform(
      wrapperRef.current.getScreenCTM()?.inverse()
    )
  }
  if (!deckDef && !viewBox) return null

  let wholeDeckViewBox
  let deckSlotsById = {}
  if (deckDef != null) {
    const [viewBoxOriginX, viewBoxOriginY] = deckDef.cornerOffsetFromOrigin
    const [deckXDimension, deckYDimension] = deckDef.dimensions

    deckSlotsById = deckDef.locations.orderedSlots.reduce(
      (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
      {}
    )
    wholeDeckViewBox = `${viewBoxOriginX} ${viewBoxOriginY} ${deckXDimension} ${deckYDimension}`
  }
  return (
    <Svg
      viewBox={viewBox || wholeDeckViewBox}
      ref={wrapperRef}
      id={id}
      /* reflect horizontally about the center of the DOM elem */
      transform="scale(1, -1)"
      {...styleProps}
    >
      {deckDef != null && (
        <StyledDeck
          deckFill={deckFill}
          def={deckDef}
          layerBlocklist={deckLayerBlocklist}
          trashSlotName={trashSlotName}
        />
      )}
      {children?.({ deckSlotsById, getRobotCoordsFromDOMCoords })}
    </Svg>
  )
}
