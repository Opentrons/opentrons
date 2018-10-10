// @flow
import * as React from 'react'
import cx from 'classnames'
import {SLOT_WIDTH_MM, SLOT_HEIGHT_MM} from '../constants.js'
import styles from './SingleLabware.css'

type Props = {
  className?: string,
  children?: React.Node,
  showLabels?: boolean,
}
export const LABEL_OFFSET = 8

/** Simply wraps SVG components like Plate/SelectablePlate with correct dimensions */
export default function SingleLabware (props: Props) {
  const {children, className, showLabels = false} = props
  const minX = showLabels ? -LABEL_OFFSET : 0
  const minY = showLabels ? -LABEL_OFFSET : 0
  const width = showLabels ? SLOT_WIDTH_MM + LABEL_OFFSET : SLOT_WIDTH_MM
  const height = showLabels ? SLOT_HEIGHT_MM + LABEL_OFFSET : SLOT_HEIGHT_MM
  return (
    <div className={cx(styles.single_labware, className)}>
      <svg viewBox={`${minX} ${minY} ${width} ${height}`}>
        {children}
      </svg>
    </div>
  )
}
