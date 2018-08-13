// @flow
import * as React from 'react'
import cx from 'classnames'

import type {WellDefinition} from '@opentrons/shared-data'
import styles from './Well.css'

type Props = {
  wellDef: WellDefinition,
  empty?: ?boolean,
  highlighted?: ?boolean
}

export default function Tip (props: Props) {
  const {wellDef, empty, highlighted} = props
  const circleProps = {
    cx: wellDef.x,
    cy: wellDef.y
  }

  // TODO: Ian 2018-08-13 refine tip sizes for different tip racks, use `tipVolume`.
  let outerRadius = 3
  let innerRadius = 2

  if (empty) {
    return <circle
      {...circleProps}
      r={outerRadius}
      className={cx(styles.empty_tip, styles.well_border)}
    />
  }

  const outerCircleClassName = cx(
    styles.well_border,
    {
      [styles.highlighted]: highlighted
    }
  )

  return (
    <g>
      {/* Fill contents */}
      <circle
        {...circleProps}
        r={outerRadius}
        className={styles.tip_fill}
      />
      {/* Outer circle */}
      <circle
        {...circleProps}
        r={outerRadius}
        className={outerCircleClassName}
      />
      {/* Inner circle */}
      <circle
        {...circleProps}
        r={innerRadius}
        className={styles.well_border}
      />
    </g>
  )
}
