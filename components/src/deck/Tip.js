// @flow
import * as React from 'react'
import cx from 'classnames'

import type { WellDefinition } from '@opentrons/shared-data'
import styles from './Well.css'

export type TipProps = {|
  wellDef: WellDefinition,
  tipVolume: ?number,
  empty?: ?boolean,
  highlighted?: ?boolean,
|}

export function Tip(props: TipProps): React.Node {
  const { wellDef, empty, highlighted, tipVolume } = props
  const circleProps = {
    cx: wellDef.x,
    cy: wellDef.y,
  }

  // TODO: Ian 2018-08-13 refine tip sizes for different tip racks
  let outerRadius = 3
  let innerRadius = 2

  if (typeof tipVolume === 'number' && tipVolume > 20) {
    outerRadius = 3.5
    innerRadius = 2.5
  }

  if (empty) {
    return (
      <circle
        {...circleProps}
        r={outerRadius}
        className={cx(styles.empty_tip, styles.tip_border)}
      />
    )
  }

  const outerCircleClassName = highlighted
    ? styles.highlighted
    : styles.tip_border

  return (
    <g>
      {/* Fill contents */}
      <circle {...circleProps} r={outerRadius} className={styles.tip_fill} />
      {/* Outer circle */}
      <circle
        {...circleProps}
        r={outerRadius}
        className={outerCircleClassName}
      />
      {/* Inner circle */}
      <circle {...circleProps} r={innerRadius} className={styles.tip_border} />
    </g>
  )
}
