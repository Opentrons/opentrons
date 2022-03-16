import * as React from 'react'
import { css } from 'styled-components'
import { Flex, ForeignObject } from '../../primitives'

export interface RobotCoordsForeignObjectProps {
  width: string | number
  height: string | number
  x: string | number
  y: string | number
  children?: React.ReactNode
  foreignObjectProps?: React.ComponentProps<typeof ForeignObject>
  flexProps?: React.ComponentProps<typeof Flex>
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
      <Flex
        height="100%"
        width="100%"
        css={css`
          transform: scale(1, -1);
        `}
        {...foreignObjectProps}
      >
        <Flex {...flexProps}>{children}</Flex>
      </Flex>
    </ForeignObject>
  )
}
