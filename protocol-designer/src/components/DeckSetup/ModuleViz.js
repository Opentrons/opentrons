// @flow
import * as React from 'react'
import { getModuleVizDims } from './getModuleVizDims'
import styles from './ModuleViz.css'
import type { ModuleOnDeck } from '../../step-forms'
import type { ModuleOrientation } from '../../types'

type Props = {|
  x: number,
  y: number,
  orientation: ModuleOrientation,
  module: ModuleOnDeck,
|}

const ModuleViz = (props: Props) => {
  const moduleType = props.module.type
  const { xOffset, yOffset, xDimension, yDimension } = getModuleVizDims(
    props.orientation,
    moduleType
  )
  console.log({ props, xOffset, yOffset, xDimension, yDimension })
  return (
    <rect
      x={props.x + xOffset}
      y={props.y + yOffset}
      height={yDimension}
      width={xDimension}
      className={styles.module_viz}
    />
  )
}

export default ModuleViz
