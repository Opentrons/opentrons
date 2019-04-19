// @flow
import * as React from 'react'
import cx from 'classnames'
import flatMap from 'lodash/flatMap'
import type { DeckSlot } from '../robot-types'
import { SLOT_RENDER_WIDTH, SLOT_RENDER_HEIGHT } from '@opentrons/shared-data'
import {
  SLOTNAME_MATRIX,
  SLOT_SPACING_MM,
  SLOT_OFFSET_MM,
  TRASH_SLOTNAME,
} from './constants'
import DeckOutline from './DeckOutline'
import { EmptyDeckSlot } from './EmptyDeckSlot'

import styles from './Deck.css'

export type LabwareComponentProps = {|
  slot: DeckSlot,
  width: number,
  height: number,
|}

export type LabwareComponentType = React.ComponentType<LabwareComponentProps>

type Props = {
  className?: string,
  LabwareComponent?: LabwareComponentType,
  DragPreviewLayer?: any, // TODO: BC 2019-01-03 flow doesn't like portals
}

const VIEW_BOX_WIDTH = 427
const VIEW_BOX_HEIGHT = 390

export default class Deck extends React.Component<Props> {
  // TODO Ian 2018-02-22 No support in Flow for SVGElement yet: https://github.com/facebook/flow/issues/2332
  // this `parentRef` should be HTMLElement | SVGElement
  parentRef: ?any

  getXY = (rawX: number, rawY: number) => {
    if (!this.parentRef) return {}
    const clientRect: {
      width: number,
      height: number,
      left: number,
      top: number,
    } = this.parentRef.getBoundingClientRect()

    const widthCoefficient =
      (VIEW_BOX_WIDTH - SLOT_OFFSET_MM * 2 - SLOT_SPACING_MM * 2) /
      clientRect.width
    const heightCoefficient =
      (VIEW_BOX_HEIGHT - SLOT_OFFSET_MM * 2 - SLOT_SPACING_MM * 3) /
      clientRect.height
    const scaledXOffset = (SLOT_OFFSET_MM / VIEW_BOX_WIDTH) * clientRect.width
    const scaledYOffset = (SLOT_OFFSET_MM / VIEW_BOX_HEIGHT) * clientRect.height
    const scaledX = (rawX - clientRect.left) * widthCoefficient + scaledXOffset
    const scaledY = (rawY - clientRect.top) * heightCoefficient + scaledYOffset
    return { scaledX, scaledY }
  }
  render() {
    const { className, LabwareComponent, DragPreviewLayer } = this.props

    return (
      // TODO(mc, 2018-07-16): is this viewBox in mm?
      <svg viewBox={'0 0 427 390'} className={cx(styles.deck, className)}>
        <DeckOutline />
        {/* All containers */}
        <g
          ref={ref => {
            this.parentRef = ref
          }}
          transform={`translate(${SLOT_OFFSET_MM} ${SLOT_OFFSET_MM})`}
        >
          {renderLabware(LabwareComponent)}
        </g>
        {DragPreviewLayer && <DragPreviewLayer getXY={this.getXY} />}
      </svg>
    )
  }
}

function renderLabware(
  LabwareComponent: ?LabwareComponentType
): Array<React.Node> {
  return flatMap(
    SLOTNAME_MATRIX,
    (columns: Array<DeckSlot>, row: number): Array<React.Node> => {
      return columns.map(
        (slot: DeckSlot, col: number): React.Node => {
          if (slot === TRASH_SLOTNAME) return null

          const props = {
            slot,
            width: SLOT_RENDER_WIDTH,
            height: SLOT_RENDER_HEIGHT,
          }
          const transform = `translate(${[
            SLOT_RENDER_WIDTH * col + SLOT_SPACING_MM * (col + 1),
            SLOT_RENDER_HEIGHT * row + SLOT_SPACING_MM * (row + 1),
          ].join(',')})`

          return (
            // $FlowFixMe: (mc, 2019-04-18) don't know why flow doesn't like this, don't care because this is going away
            <g key={slot} transform={transform}>
              <EmptyDeckSlot {...props} />
              {LabwareComponent && <LabwareComponent {...props} />}
            </g>
          )
        }
      )
    }
  )
}
