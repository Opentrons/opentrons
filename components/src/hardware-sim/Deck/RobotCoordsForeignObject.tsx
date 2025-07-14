import { Flex, ForeignObject } from '../../primitives'
import styles from './deck.module.css'

import type { ComponentProps, ReactNode } from 'react'

export interface RobotCoordsForeignObjectProps {
  width: string | number
  height: string | number
  x: string | number
  y: string | number
  children?: ReactNode
  foreignObjectProps?: ComponentProps<typeof ForeignObject>
  flexProps?: ComponentProps<typeof Flex>
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
    <ForeignObject {...{ x, y, height, width }}>
      <div
        className={styles.robot_coords_foreign_object_container}
        {...foreignObjectProps}
      >
        <Flex {...flexProps}>{children}</Flex>
      </div>
    </ForeignObject>
  )
}
