import { forwardRef } from 'react'

import { isntStyleProp, styleProps } from './style-props'

import type { ComponentProps, FC } from 'react'
import type { StyleProps } from './types'

/**
 * Flex primitive
 *
 * @component
 */
const FlexComponent = forwardRef<
  HTMLDivElement,
  ComponentProps<'div'> & StyleProps
>((props, ref): JSX.Element => {
  const { style, ...rest } = props

  const stylePropsStyles = styleProps(props)
  const combinedStyles = { ...stylePropsStyles, ...style }

  const forwardedProps = Object.entries(rest).reduce<Record<string, unknown>>(
    (acc, [prop, value]) => {
      if (isntStyleProp(prop)) acc[prop] = value
      return acc
    },
    {}
  )

  return (
    <div
      {...(forwardedProps as ComponentProps<'div'>)}
      ref={ref}
      style={{ display: 'flex', ...combinedStyles }}
    />
  )
})

FlexComponent.displayName = 'Flex'

export const Flex: FC<ComponentProps<'div'> & StyleProps> =
  FlexComponent as unknown as FC<ComponentProps<'div'> & StyleProps>
