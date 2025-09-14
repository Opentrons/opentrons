import { createElement } from 'react'

import { withStyleProps } from '../hocs/withStyleProps'

import type { ComponentProps, FC } from 'react'
import type { StyleProps } from './types'

/**
 * Text primitive
 *
 * @component
 */

const TextComponent = ({
  as,
  ...props
}: ComponentProps<'p'> & { as?: string }): JSX.Element => {
  const Component = as || 'p'
  return createElement(Component, {
    ...props,
    style: { marginTop: 0, marginBottom: 0, ...props.style },
  })
}

export const Text: FC<
  ComponentProps<'p'> & StyleProps & { as?: string }
> = withStyleProps(TextComponent) as FC<
  ComponentProps<'p'> & StyleProps & { as?: string }
>
