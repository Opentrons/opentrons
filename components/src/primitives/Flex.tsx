import React from 'react'
import { css } from '@linaria/core'

import { STYLE_PROPS, styleProps } from './style-props'

import type { StyleProps } from './types'

export interface FlexProps
  extends StyleProps,
    Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  children?: React.ReactNode
}

const flexStyle = css`
  display: flex;
`

/**
 * Flex primitive
 *
 * @component
 */
export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ children, ...props }, ref) => {
    // Separate style props from DOM props
    const stylePropsObj: Partial<StyleProps> = {}
    const domProps: React.HTMLAttributes<HTMLDivElement> = {}

    Object.keys(props).forEach(key => {
      if (STYLE_PROPS.includes(key as typeof STYLE_PROPS[number])) {
        ;(stylePropsObj as any)[key] = (props as any)[key]
      } else {
        ;(domProps as any)[key] = (props as any)[key]
      }
    })

    const inlineStyles = styleProps(stylePropsObj)

    return (
      <div ref={ref} className={flexStyle} style={inlineStyles} {...domProps}>
        {children}
      </div>
    )
  }
)
