// @flow
import * as React from 'react'
import {SLOT_HEIGHT} from './constants'
import {humanize} from './utils'
import styles from './LabwareContainer.css'

type Props = {
  containerType: string,
  containerName: string
}

export function ContainerNameOverlay (props: Props) {
  const {containerType, containerName} = props

  const paddingLeft = 4
  const paddingTop = 0
  const boxHeight = 25

  return (
    <g className={styles.name_overlay}>
      <g transform={`translate(0 ${SLOT_HEIGHT - boxHeight})`}>
        <rect x='0' y='0' height={boxHeight} width='100%' />
        <text x={paddingLeft} y={0.4 * boxHeight + paddingTop} className={styles.container_type}>
          {humanize(containerType).toUpperCase()}
        </text>
        <text x={paddingLeft} y={0.85 * boxHeight + paddingTop}>
          {containerName}
        </text>
      </g>
    </g>
  )
}
