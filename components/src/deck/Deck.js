// @flow
import * as React from 'react'
import cx from 'classnames'
import flatMap from 'lodash/flatMap'
import type {DeckSlot} from '../robot-types'
import {
  SLOT_RENDER_WIDTH,
  SLOT_RENDER_HEIGHT,
} from '@opentrons/shared-data'
import {
  SLOTNAME_MATRIX,
  SLOT_SPACING_MM,
  SLOT_OFFSET_MM,
  TRASH_SLOTNAME,
} from './constants'
import DeckOutline from './DeckOutline'
import {EmptyDeckSlot} from './EmptyDeckSlot'

import styles from './Deck.css'

export type LabwareComponentProps = {
  slot: DeckSlot,
  width: number,
  height: number,
}

type Props = {
  className?: string,
  LabwareComponent?: React.ComponentType<LabwareComponentProps>,
  DragPreviewLayer: React.Element<*>,
}

const VIEW_BOX_WIDTH = 427
const VIEW_BOX_HEIGHT = 390

export default class Deck extends React.Component<Props> {
  parentRef: ?SVGElement

  getXY = (rawX: number, rawY: number) => {
    if (!this.parentRef) return {}
    const clientRect: {width: number, height: number, left: number, top: number} = this.parentRef.getBoundingClientRect()

    const scaledX = (rawX - clientRect.left) * (VIEW_BOX_WIDTH / clientRect.width)
    const scaledY = (rawY - clientRect.top) * (VIEW_BOX_HEIGHT / clientRect.height)
    return {scaledX, scaledY}
  }
  render () {
    const {className, LabwareComponent, DragPreviewLayer} = this.props

    return (
      // TODO(mc, 2018-07-16): is this viewBox in mm?
      <svg viewBox={'0 0 427 390'} className={cx(styles.deck, className)}>
        <DeckOutline />
        {/* All containers */}
        <g
          ref={ref => { this.parentRef = ref }}
          transform={`translate(${SLOT_OFFSET_MM} ${SLOT_OFFSET_MM})`}>
          {renderLabware(LabwareComponent)}
          <DragPreviewLayer getXY={this.getXY} />
        </g>
      </svg>
    )
  }
}

function renderLabware (LabwareComponent): React.Node[] {
  return flatMap(
    SLOTNAME_MATRIX,
    (columns: Array<DeckSlot>, row: number): React.Node[] => {
      return columns.map((slot: DeckSlot, col: number) => {
        if (slot === TRASH_SLOTNAME) return null

        const props = {slot, width: SLOT_RENDER_WIDTH, height: SLOT_RENDER_HEIGHT}
        const transform = `translate(${[
          SLOT_RENDER_WIDTH * col + SLOT_SPACING_MM * (col + 1),
          SLOT_RENDER_HEIGHT * row + SLOT_SPACING_MM * (row + 1),
        ].join(',')})`

        return (
          <g key={slot} transform={transform}>
            <EmptyDeckSlot {...props} />
            {LabwareComponent && (
              <LabwareComponent {...props} />
            )}
          </g>
        )
      })
    })
}
