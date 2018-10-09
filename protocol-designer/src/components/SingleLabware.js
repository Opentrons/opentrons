// @flow
import * as React from 'react'
import cx from 'classnames'
import {SLOT_WIDTH_MM, SLOT_HEIGHT_MM} from '../constants.js'
import styles from './SingleLabware.css'

type Props = {
  className?: string,
  children?: React.Node,
  innerLabels?: boolean,
}

const OUTER_LABEL_OFFSET = 8

/** Simply wraps SVG components like Plate/SelectablePlate with correct dimensions */
export default function SingleLabware (props: Props) {
  const {children, className, innerLabels = true} = props
  const minX = innerLabels ? 0 : -OUTER_LABEL_OFFSET
  const minY = innerLabels ? 0 : -OUTER_LABEL_OFFSET
  const width = innerLabels ? SLOT_WIDTH_MM : (SLOT_WIDTH_MM + OUTER_LABEL_OFFSET)
  const height = innerLabels ? SLOT_HEIGHT_MM : (SLOT_HEIGHT_MM + OUTER_LABEL_OFFSET)
  return (
    <div className={cx(styles.single_labware, className)}>
      <svg viewBox={`${minX} ${minY} ${width} ${height}`}>
        {children}
      </svg>
    </div>
  )
}
