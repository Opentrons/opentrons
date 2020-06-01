// @flow
import * as React from 'react'
import cx from 'classnames'
import { Icon } from '../icons'
import styles from './styles.css'

export type SlotMapProps = {|
  /** Slot(s) to highlight */
  occupiedSlots: Array<string>,
  /** Optional collision warning */
  collisionSlots?: Array<string>,
  /** Optional error styling */
  isError?: boolean,
|}

const SLOT_MAP_SLOTS = [
  ['10', '11'],
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
]

const slotWidth = 33
const slotHeight = 23
const iconSize = 20
const numRows = 4
const numCols = 3

export function SlotMap(props: SlotMapProps): React.Node {
  const { collisionSlots, occupiedSlots, isError } = props
  return (
    <svg
      viewBox={`-1,-1,${slotWidth * numCols + 2}, ${slotHeight * numRows + 2}`}
    >
      {SLOT_MAP_SLOTS.flatMap((row, rowIndex) =>
        row.map((slot, colIndex) => {
          const isCollisionSlot =
            collisionSlots && collisionSlots.includes(slot)
          const isOccupiedSlot = occupiedSlots.includes(slot)
          return (
            <g
              key={slot}
              transform={`translate(${colIndex * slotWidth} ${rowIndex *
                slotHeight})`}
            >
              <rect
                className={cx(styles.slot_rect, {
                  [styles.slot_occupied]: isOccupiedSlot,
                  [styles.slot_error]: isError,
                })}
                width={slotWidth}
                height={slotHeight}
              />
              {isCollisionSlot && (
                <Icon
                  className={styles.collision_icon}
                  name="information"
                  width={iconSize}
                  height={iconSize}
                  x={slotWidth / 2 - iconSize / 2}
                  y={slotHeight / 2 - iconSize / 2}
                />
              )}
            </g>
          )
        })
      )}
    </svg>
  )
}
