// @flow
import * as React from 'react'
import cx from 'classnames'
import { DeckFromData } from './Deck'
import type { DeckDefinition } from '@opentrons/shared-data'
import styles from './RobotWorkSpace.css'
import type { RobotWorkSpaceRenderProps } from './types'

export type RobotWorkSpaceProps = {|
  deckDef?: DeckDefinition,
  viewBox?: string,
  className?: string,
  children?: RobotWorkSpaceRenderProps => React.Node,
  deckLayerBlocklist?: Array<string>,
|}

type GetRobotCoordsFromDOMCoords = $PropertyType<
  RobotWorkSpaceRenderProps,
  'getRobotCoordsFromDOMCoords'
>

export function RobotWorkSpace(props: RobotWorkSpaceProps): React.Node {
  const { children, deckDef, deckLayerBlocklist = [], viewBox } = props
  const wrapperRef: {| current: Element | null |} = React.useRef(null)

  // NOTE: getScreenCTM in Chrome a DOMMatrix type,
  // in Firefox the same fn returns a deprecated SVGMatrix.
  // Until Firefox fixes this and conforms to SVG2 draft,
  // it will suffer from inverted y behavior (ignores css transform)
  const getRobotCoordsFromDOMCoords: GetRobotCoordsFromDOMCoords = (x, y) => {
    if (!wrapperRef.current) return { x: 0, y: 0 }

    // $FlowFixMe(mc, 2020-06-01): Flow has no SVGElement
    const cursorPoint = wrapperRef.current.createSVGPoint()

    cursorPoint.x = x
    cursorPoint.y = y

    return cursorPoint.matrixTransform(
      // $FlowFixMe(mc, 2020-06-01): Flow has no SVGElement
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
        <DeckFromData def={deckDef} layerBlocklist={deckLayerBlocklist} />
      )}
      {children && children({ deckSlotsById, getRobotCoordsFromDOMCoords })}
    </svg>
  )
}
