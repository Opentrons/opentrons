// @flow
import * as React from 'react'

import styles from './Module.css'

type Props = {name: string}

// TODO (ka 2019-1-7): should these be optionally overridden with props?
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
