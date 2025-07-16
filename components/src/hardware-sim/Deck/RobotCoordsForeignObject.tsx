import { ForeignObject } from '../../primitives'
import styles from './deck.module.css'

import type { ReactNode } from 'react'

export type FlexDirection = 'column' | 'row'

interface ForeignObjectProps {
  cursor?: string
  opacity?: string | number
  flex?: string
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  display?: string
  alignItems?: string
  zIndex?: number | string
  onClick?: () => void
}
export interface RobotCoordsForeignObjectProps {
  width: string | number
  height: string | number
  x: string | number
  y: string | number
  children?: ReactNode
  foreignObjectProps?: ForeignObjectProps
  flexProps?: {
    flexDirection?: FlexDirection
    justifyContent?: string
    padding?: string
    fontSize?: string
    fontWeight?: number
    paddingBottom?: string
    flex?: string
    onClick?: () => void
    onMouseEnter?: () => void
    onMouseLeave?: () => void
    backgroundColor?: string
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

  const { onMouseEnter, onMouseLeave, onClick, ...rest } = foreignObjectProps
  const {
    onMouseEnter: flexOnMouseEnter,
    onMouseLeave: flexOnMouseLeave,
    onClick: flexOnClick,
    ...restFlexProps
  } = flexProps

  return (
    <ForeignObject x={x} y={y} height={height} width={width}>
      <div
        className={styles.robot_coords_foreign_object_container}
        style={{
          ...rest,
        }}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div
          onClick={flexOnClick}
          onMouseEnter={flexOnMouseEnter}
          onMouseLeave={flexOnMouseLeave}
          style={{ ...restFlexProps }}
        >
          {children}
        </div>
      </div>
    </ForeignObject>
  )
}
