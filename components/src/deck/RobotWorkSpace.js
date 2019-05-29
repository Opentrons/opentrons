// @flow
import React, { useRef } from 'react'
import { DeckFromData } from './Deck'
import type { DeckDefinition, DeckSlot } from '@opentrons/shared-data'
import styles from './RobotWorkSpace.css'

type RenderProps = {
  slots: { [string]: DeckSlot },
}
type Props = {
  deckDef?: DeckDefinition,
  viewBox?: string,
  children?: RenderProps => React.Node,
  deckLayerBlacklist?: Array<string>,
}

function RobotWorkSpace(props: Props) {
  const { children, deckDef, deckLayerBlacklist = [], viewBox } = props
  const wrapperRef: ElementRef<'svg'> = useRef()
  const getRobotCoordsFromDOM = useRef((left: number, top: number) => {
    const cursorPoint = wrapperRef && wrapperRef.createSVGPoint()

    cursorPoint.x = left
    cursorPoint.y = top

    const cursor = cursorPoint.matrixTransform(
      wrapperRef.getScreenCTM().inverse()
    )

    return cursor
  })
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
      {children && children({ slots, getRobotCoordsFromDOM })}
    </svg>
  )
}

export default RobotWorkSpace
