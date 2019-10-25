// @flow
import * as React from 'react'
import moduleVizDims from './moduleVizDims'
import styles from './ModuleViz.css'
import type { ModuleOnDeck } from '../../step-forms'

type Props = {|
  x: number,
  y: number,
  orientation: 'left' | 'right',
  module: ModuleOnDeck,
|}

const ModuleViz = (props: Props) => {
  const moduleType = props.module.type
  const {
    xOffsetLeft,
    xOffsetRight,
    yOffset,
    xDimension,
    yDimension,
  } = moduleVizDims[moduleType]
  return (
    <rect
      x={props.x + (props.orientation === 'left' ? xOffsetLeft : xOffsetRight)}
      y={props.y + yOffset}
      height={yDimension}
      width={xDimension}
      className={styles.module_render}
    />
  )
}

export default ModuleViz
