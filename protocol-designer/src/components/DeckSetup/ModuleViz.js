// @flow
import * as React from 'react'

import type { ModuleOnDeck } from '../../step-forms'
import type { ModuleOrientation } from '../../types'
import { getModuleVizDims } from './getModuleVizDims'
import styles from './ModuleViz.css'

type Props = {|
  x: number,
  y: number,
  orientation: ModuleOrientation,
  module: ModuleOnDeck,
  slotName: string,
|}

export const ModuleViz = (props: Props): React.Node => {
  const moduleType = props.module.type
  const {
    xOffset,
    yOffset,
    xDimension,
    yDimension,
    childXOffset,
    childYOffset,
    childXDimension,
    childYDimension,
  } = getModuleVizDims(props.orientation, moduleType)

  return (
    <g data-test={`ModuleViz_${moduleType}`}>
      <rect
        x={props.x + xOffset}
        y={props.y + yOffset}
        height={yDimension}
        width={xDimension}
        className={styles.module_viz}
      />
      <rect
        x={props.x + childXOffset}
        y={props.y + childYOffset}
        height={childYDimension}
        width={childXDimension}
        className={styles.module_slot_area}
      />
    </g>
  )
}
