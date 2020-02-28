// @flow
import React, { useRef, type Node, type ElementRef } from 'react'
import cx from 'classnames'
import { DeckFromData } from './Deck'
import type { DeckDefinition } from '@opentrons/shared-data'
import styles from './RobotWorkSpace.css'
import type { RobotWorkSpaceRenderProps } from './types'

export type RobotWorkSpaceProps = {|
  deckDef?: DeckDefinition,
  viewBox?: string,
  className?: string,
  children?: RobotWorkSpaceRenderProps => Node,
  deckLayerBlacklist?: Array<string>,
|}

type GetRobotCoordsFromDOMCoords = $PropertyType<
  RobotWorkSpaceRenderProps,
  'getRobotCoordsFromDOMCoords'
>

export function RobotWorkSpace(props: RobotWorkSpaceProps) {
  const { children, deckDef, deckLayerBlacklist = [], viewBox } = props
  const wrapperRef: ElementRef<*> = useRef(null)

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
      wrapperRef.current.getScreenCTM().inverse()
    )
  }
  if (!deckDef && !viewBox) return null

  let wholeDeckViewBox = null
  let deckSlotsById = {}
  if (deckDef) {
    const [viewBoxOriginX, viewBoxOriginY] = deckDef.cornerOffsetFromOrigin
    const [deckXDimension, deckYDimension] = deckDef.dimensions

    deckSlotsById = deckDef.locations.orderedSlots.reduce(
      (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
      {}
    )
    wholeDeckViewBox = `${viewBoxOriginX} ${viewBoxOriginY} ${deckXDimension} ${deckYDimension}`
  }

  return (
    <svg
      className={cx(styles.robot_work_space, props.className)}
      viewBox={viewBox || wholeDeckViewBox}
      ref={wrapperRef}
    >
      {deckDef && (
        <DeckFromData def={deckDef} layerBlacklist={deckLayerBlacklist} />
      )}
      {children && children({ deckSlotsById, getRobotCoordsFromDOMCoords })}
    </svg>
  )
}
