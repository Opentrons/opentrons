import * as React from 'react'
import { css } from 'styled-components'
import { ForeignObject } from '../../primitives'
export interface RobotCoordsForeignObjectProps {
  width: string | number
  height: string | number
  x: string | number
  y: string | number
  children?: React.ReactNode
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
    flexProps = {},
  } = props

  return (
    <ForeignObject {...{ x, y, height, width }}>
      <div
        css={css`
          height: 100%;
          width: 100%;
          transform: scale(1, -1);
        `}
      >
        <div {...flexProps}>{children}</div>
      </div>
    </ForeignObject>
  )
}
