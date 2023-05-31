import * as React from 'react'
import { StyleProps, Svg } from '../../primitives'
import { DeckFromData } from './DeckFromData'

import type { DeckDefinition, DeckSlot } from '@opentrons/shared-data'

const DECK_FADE_IN_DELAY_MS = 200
const DECK_FADE_IN_DURATION_MS = 200
const DECK_FADE_OUT_DELAY_MS = 1200
const DECK_FADE_OUT_DURATION_MS = 200

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
  deckLayerBlocklist?: string[]
  id?: string
  animateDeckDependantEvent?: 'splash' | 'move'
}

type GetRobotCoordsFromDOMCoords = RobotWorkSpaceRenderProps['getRobotCoordsFromDOMCoords']

export function RobotWorkSpace(props: RobotWorkSpaceProps): JSX.Element | null {
  const {
    children,
    deckDef,
    deckLayerBlocklist = [],
    viewBox,
    id,
    animateDeckDependantEvent,
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
      opacity="1"
      /* reflect horizontally about the center of the DOM elem */
      transform="scale(1, -1)"
      {...styleProps}
    >
      {deckDef != null && (
        <DeckFromData def={deckDef} layerBlocklist={deckLayerBlocklist} />
      )}
      {children?.({ deckSlotsById, getRobotCoordsFromDOMCoords })}
      {animateDeckDependantEvent != null ? (
        <>
          <animate
            id="deck-out"
            attributeName="opacity"
            from="1"
            to="0"
            begin={
              animateDeckDependantEvent === 'splash'
                ? `splash-out.end+${DECK_FADE_OUT_DELAY_MS}ms`
                : `labware-move.end+${DECK_FADE_OUT_DELAY_MS}ms`
            }
            dur={`${DECK_FADE_OUT_DURATION_MS}ms`}
            calcMode="ease-out"
            fill="freeze"
          />
          <animate
            id="deck-in"
            attributeName="opacity"
            from="0"
            to="1"
            begin={`deck-out.end+${DECK_FADE_IN_DELAY_MS}ms`}
            dur={`${DECK_FADE_IN_DURATION_MS}ms`}
            calcMode="ease-out"
            fill="freeze"
          />
        </>
      ) : null}
    </Svg>
  )
}
