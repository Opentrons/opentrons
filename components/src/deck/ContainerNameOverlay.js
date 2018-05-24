// @flow
import * as React from 'react'
import {SLOT_HEIGHT} from './constants'
import styles from './LabwareContainer.css'

type Props = {
  displayName: string
}

export function ContainerNameOverlay (props: Props) {
  const {displayName} = props

  const paddingLeft = 4
  const paddingTop = 5
  const boxHeight = 18

  return (
    <g className={styles.name_overlay}>
      <g transform={`translate(0 ${SLOT_HEIGHT - boxHeight})`}>
        <rect x='0' y='0' height={boxHeight} width='100%' />
        <text
          x={paddingLeft}
          y={0.4 * boxHeight + paddingTop}
          className={styles.display_name}
        >
          {displayName}
        </text>
      </g>
    </g>
  )
}
