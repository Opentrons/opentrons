// @flow
import * as React from 'react'
import cx from 'classnames'
import {SLOT_WIDTH_MM, SLOT_HEIGHT_MM} from '../constants.js'
import styles from './SingleLabware.css'

type Props = {className?: string, children?: React.Node}
const LABEL_OFFSET = 8

/** Simply wraps SVG components like Plate/SelectablePlate with correct dimensions */
export default function SingleLabware (props: Props) {
  const {children, className} = props
  const minX = -LABEL_OFFSET
  const minY = -LABEL_OFFSET
  const width = SLOT_WIDTH_MM + LABEL_OFFSET
  const height = SLOT_HEIGHT_MM + LABEL_OFFSET
  return (
    <div className={cx(styles.single_labware, className)}>
      <svg viewBox={`${minX} ${minY} ${width} ${height}`}>
        {children}
      </svg>
    </div>
  )
}
