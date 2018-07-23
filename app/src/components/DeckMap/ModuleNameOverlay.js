// @flow
import * as React from 'react'

import styles from './styles.css'

type Props = {name: string}

const HEIGHT = 20
const PADDING_LEFT = 4

export default function ModuleNameOverlay (props: Props) {
  return (
    <React.Fragment>
      <rect
        className={styles.module_name_overlay}
        width='100%'
        height={HEIGHT}
      />
      <text
        className={styles.module_name_text}
        dominantBaseline='central'
        x={PADDING_LEFT}
        y={HEIGHT / 2}
      >
        {props.name}
      </text>
    </React.Fragment>
  )
}
