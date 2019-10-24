// @flow
import * as React from 'react'
import moduleRenderSizes from './moduleRenderSizes'
import styles from './ModuleRender.css'
import type { ModuleOnDeck } from '../../step-forms'

type Props = {|
  x: number,
  y: number,
  orientation: 'left' | 'right',
  module: ModuleOnDeck,
|}

const ModuleRender = (props: Props) => {
  const moduleType = props.module.type
  const { xOffset, yOffset, xDimension, yDimension } = moduleRenderSizes[
    moduleType
  ]
  return (
    <rect
      x={props.x + (props.orientation === 'left' ? 1 : -1) * xOffset}
      y={props.y + yOffset}
      height={yDimension}
      width={xDimension}
      className={styles.module_render}
    />
  )
}

export default ModuleRender
