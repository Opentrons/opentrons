// @flow
import * as React from 'react'
import {SLOT_HEIGHT_MM} from './constants'
import styles from './LabwareContainer.css'

type Props = {
  title: string,
  subtitle?: ?string,
}

export function ContainerNameOverlay (props: Props) {
  const {title, subtitle} = props

  let paddingLeft = 4
  let paddingTop = 0
  let boxHeight = 25

  if (!subtitle) {
    paddingTop = 5
    boxHeight = 18
  }

  return (
    <g className={styles.name_overlay}>
      <g transform={`translate(0 ${SLOT_HEIGHT_MM - boxHeight})`}>
        <rect x='0' y='0' height={boxHeight} width='100%' />
        <text
          x={paddingLeft}
          y={0.4 * boxHeight + paddingTop}
          className={styles.display_name}
        >
          {title}
        </text>
        {subtitle && (
          <text x={paddingLeft} y={0.85 * boxHeight + paddingTop}>
            {subtitle}
          </text>
        )}
      </g>
    </g>
  )
}
