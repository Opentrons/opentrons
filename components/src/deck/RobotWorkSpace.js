// @flow
import React, { useRef, type Node, type ElementRef } from 'react'
import { DeckFromData } from './Deck'
import type { DeckDefinition } from '@opentrons/shared-data'
import styles from './RobotWorkSpace.css'
import type { RobotWorkSpaceRenderProps } from './types'

type Props = {
  deckDef?: DeckDefinition,
  viewBox?: string,
  children?: RobotWorkSpaceRenderProps => Node,
  deckLayerBlacklist?: Array<string>,
}

function RobotWorkSpace(props: Props) {
  const { children, deckDef, deckLayerBlacklist = [], viewBox } = props
  const wrapperRef: ElementRef<*> = useRef(null)

  // NOTE: getScreenCTM in Chrome a DOMMatrix type,
  // in Firefox the same fn returns a deprecated SVGMatrix.
  // Until Firefox fixes this and conforms to SVG2 draft,
  // it will suffer from inverted y behavior (ignores css transform)
  // $FlowFixMe(bc, 2019-05-31): flow type svg ref
  const getRobotCoordsFromDOMCoords = (
    x: number,
    y: number
  ): { x: number, y: number } => {
    if (!wrapperRef.current) return { x: 0, y: 0 }
    const cursorPoint = wrapperRef.current.createSVGPoint()

    cursorPoint.x = x
    cursorPoint.y = y

    return cursorPoint.matrixTransform(
      wrapperRef.current.getScreenCTM().inverse()
    )
  }
  if (!deckDef && !viewBox) return null

  let wholeDeckViewBox = null
  let slots = {}
  if (deckDef) {
    const [viewBoxOriginX, viewBoxOriginY] = deckDef.cornerOffsetFromOrigin
    const [deckXDimension, deckYDimension] = deckDef.dimensions

    slots = deckDef.locations.orderedSlots.reduce(
      (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
      {}
    )
    wholeDeckViewBox = `${viewBoxOriginX} ${viewBoxOriginY} ${deckXDimension} ${deckYDimension}`
  }

  return (
    <svg
      className={styles.robot_work_space}
      viewBox={viewBox || wholeDeckViewBox}
      ref={wrapperRef}
    >
      {deckDef && (
        <DeckFromData def={deckDef} layerBlacklist={deckLayerBlacklist} />
      )}
      {children && children({ slots, getRobotCoordsFromDOMCoords })}
    </svg>
  )
}

export default RobotWorkSpace
