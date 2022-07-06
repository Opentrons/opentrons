import * as React from 'react'
import cx from 'classnames'
import { DeckFromData } from './DeckFromData'
import styles from './RobotWorkSpace.css'

import type { DeckDefinition, DeckSlot } from '@opentrons/shared-data'

export interface RobotWorkSpaceRenderProps {
  deckSlotsById: { [slotId: string]: DeckSlot }
  getRobotCoordsFromDOMCoords: (
    domX: number,
    domY: number
  ) => { x: number; y: number }
}

export interface RobotWorkSpaceProps {
  deckDef?: DeckDefinition
  viewBox?: string
  className?: string
  children?: (props: RobotWorkSpaceRenderProps) => React.ReactNode
  deckLayerBlocklist?: string[]
  id?: string
}

type GetRobotCoordsFromDOMCoords = RobotWorkSpaceRenderProps['getRobotCoordsFromDOMCoords']

export function RobotWorkSpace(props: RobotWorkSpaceProps): JSX.Element | null {
  const { children, deckDef, deckLayerBlocklist = [], viewBox, id } = props
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
      id={id}
    >
      {deckDef && (
        <DeckFromData def={deckDef} layerBlocklist={deckLayerBlocklist} />
      )}
      {children && children({ deckSlotsById, getRobotCoordsFromDOMCoords })}
    </svg>
  )
}
