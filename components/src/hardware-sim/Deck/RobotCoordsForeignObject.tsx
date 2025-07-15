import { ForeignObject } from '../../primitives'
import styles from './deck.module.css'

import type { CSSProperties, ReactNode } from 'react'

export type FlexDirection = 'column' | 'row'
export interface RobotCoordsForeignObjectProps {
  width: string | number
  height: string | number
  x: string | number
  y: string | number
  children?: ReactNode
  foreignObjectProps?: CSSProperties
  flexProps?: {
    flexDirection?: FlexDirection
    justifyContent?: string
    padding?: string
    fontSize?: string
    fontWeight?: number
    paddingBottom?: string
    flex?: string
  }
}

export const RobotCoordsForeignObject = (
  props: RobotCoordsForeignObjectProps
): JSX.Element => {
  const {
    children,
    x,
    y,
    height,
    width,
    foreignObjectProps = {},
    flexProps = {},
  } = props

  return (
    <ForeignObject x={x} y={y} height={height} width={width}>
      <div
        className={styles.robot_coords_foreign_object_container}
        style={{ ...foreignObjectProps }}
      >
        <div style={{ ...flexProps }}>{children}</div>
      </div>
    </ForeignObject>
  )
}
