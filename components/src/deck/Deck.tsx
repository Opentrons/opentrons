import * as React from 'react'
import cx from 'classnames'
import flatMap from 'lodash/flatMap'
import map from 'lodash/map'
import snakeCase from 'lodash/snakeCase'
import { SLOT_RENDER_WIDTH, SLOT_RENDER_HEIGHT } from '@opentrons/shared-data'
import {
  SLOTNAME_MATRIX,
  SLOT_SPACING_MM,
  SLOT_OFFSET_MM,
  TRASH_SLOTNAME,
} from './constants'
import { DeckOutline } from './DeckOutline'
import { EmptyDeckSlot } from './EmptyDeckSlot'

import styles from './Deck.css'

import type {
  DeckDefinition,
  DeckLayer,
  DeckLayerFeature,
  DeckSlotId,
} from '@opentrons/shared-data'

export interface LabwareComponentProps {
  slot: DeckSlotId
  width: number
  height: number
}

export type LabwareComponentType = React.ComponentType<LabwareComponentProps>

export interface DeckProps {
  className?: string
  LabwareComponent?: LabwareComponentType
  DragPreviewLayer?: React.ReactPortal
}

const VIEW_BOX_WIDTH = 427
const VIEW_BOX_HEIGHT = 390

// TODO(mc, 2020-02-19): this component is no longer used
// replace with DeckFromData (see BC's TODO below)
/**
 * @deprecated Use {@link RobotWorkSpace}
 */
export class Deck extends React.Component<DeckProps> {
  parentRef: Element | null | undefined

  getXY: (
    rawX: number,
    rawY: number
  ) => { scaledX?: number; scaledY?: number } = (rawX, rawY) => {
    if (!this.parentRef) return {}
    const clientRect: {
      width: number
      height: number
      left: number
      top: number
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

  render(): JSX.Element {
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
        {/* @ts-expect-error this is deprecated unused and slated for removal */}
        {DragPreviewLayer && <DragPreviewLayer getXY={this.getXY} />}
      </svg>
    )
  }
}

function renderLabware(
  LabwareComponent: LabwareComponentType | null | undefined
): React.ReactNode[] {
  return flatMap(
    SLOTNAME_MATRIX,
    (columns: DeckSlotId[], row: number): React.ReactNode[] => {
      return columns.map((slot: DeckSlotId, col: number) => {
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
          <g key={slot} transform={transform}>
            <EmptyDeckSlot slot={slot} />
            {LabwareComponent && <LabwareComponent {...props} />}
          </g>
        )
      })
    }
  )
}

// TODO: BC 2019-05-03 we should migrate to only using the DeckFromData
// component; once Deck is removed, we should rename it Deck

export interface DeckFromDataProps {
  def: DeckDefinition
  layerBlocklist: string[]
}

export function DeckFromData(props: DeckFromDataProps): JSX.Element {
  const { def, layerBlocklist } = props
  return (
    <g>
      {map(def.layers, (layer: DeckLayer, layerId: string) => {
        if (layerBlocklist.includes(layerId)) return null
        return (
          <g id={layerId} key={layerId}>
            <path
              className={cx(
                styles.deck_outline,
                styles[def.otId],
                styles[snakeCase(layerId)]
              )}
              d={layer.map((l: DeckLayerFeature) => l.footprint).join(' ')}
            />
          </g>
        )
      })}
    </g>
  )
}
