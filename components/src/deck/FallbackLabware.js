// @flow
import * as React from 'react'
import LabwareOutline from './LabwareOutline'
import styles from './Labware.css'

export default function FallbackLabware () {
  return (
    <g>
      <LabwareOutline />
      <text x='50%' y='50%' textAnchor='middle' className={styles.fallback_plate_text}>
        Custom Container
      </text>
    </g>
  )
}
