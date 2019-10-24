// @flow
import * as React from 'react'
import styles from './ModuleRender.css'
import type { ModuleOnDeck } from '../../step-forms'

type Props = {|
  x: number,
  y: number,
  orientation: 'left' | 'right',
  module: ModuleOnDeck,
|}

// TODO IMMEDIATELY: account for rotation L/R, and all 3 module differentes
const MODULE_EXCESS_X_LEFT = 4
const MODULE_EXCESS_X_RIGHT = 4
const MODULE_HEIGHT = 86
const MODULE_WIDTH = 128

const ModuleRender = (props: Props) => (
  <rect
    x={props.x - MODULE_EXCESS_X_LEFT}
    y={props.y}
    height={MODULE_HEIGHT}
    width={MODULE_WIDTH + MODULE_EXCESS_X_LEFT + MODULE_EXCESS_X_RIGHT}
    className={styles.module_render}
  />
)

export default ModuleRender
