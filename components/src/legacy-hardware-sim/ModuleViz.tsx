import * as React from 'react'
import styles from './ModuleViz.module.css'
import { getModuleVizDims, ModuleType } from '@opentrons/shared-data'

interface Props {
  x: number
  y: number
  orientation: 'left' | 'right'
  moduleType: ModuleType
}

export const ModuleViz = (props: Props): JSX.Element => {
  const moduleType = props.moduleType
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
