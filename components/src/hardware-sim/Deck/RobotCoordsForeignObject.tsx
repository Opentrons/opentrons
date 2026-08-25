import { withStyleProps } from '../../hocs/withStyleProps'
import { ForeignObject } from '../../primitives'
import styles from './deck.module.css'

import type { HTMLAttributes, ReactNode } from 'react'
import type { StyleProps } from '../../primitives/types'

export type FlexDirection = 'column' | 'row'

const StyledDiv = withStyleProps('div' as any)

export interface RobotCoordsForeignObjectProps {
  width: string | number
  height: string | number
  x: string | number
  y: string | number
  children?: ReactNode
  foreignObjectProps?: StyleProps
  foreignObjectEvents?: HTMLAttributes<HTMLDivElement>
  flexProps?: StyleProps
  flexEvents?: HTMLAttributes<HTMLDivElement>
}
export const RobotCoordsForeignObject = ({
  children,
  x,
  y,
  height,
  width,
  foreignObjectEvents,
  foreignObjectProps = {},
  flexProps,
  flexEvents = {},
}: RobotCoordsForeignObjectProps): ReactNode => {
  return (
    <ForeignObject x={x} y={y} height={height} width={width}>
      <StyledDiv
        className={styles.robot_coords_foreign_object_container}
        {...foreignObjectEvents}
        style={foreignObjectProps}
      >
        <StyledDiv {...flexEvents} style={flexProps}>
          {children}
        </StyledDiv>
      </StyledDiv>
    </ForeignObject>
  )
}
