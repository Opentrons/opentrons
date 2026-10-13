import { createElement } from 'react'
import clsx from 'clsx'

import { isntStyleProp, styleProps } from '../../primitives/style-props'
import { resolveLegacyTextStyle } from './legacyTextStyles'

import type { ComponentProps, ReactNode } from 'react'
import type { StyleProps } from '../../primitives/types'

export interface LegacyProps
  extends StyleProps, Omit<ComponentProps<'p'>, 'color' | 'as'> {
  children?: ReactNode
  as?: keyof JSX.IntrinsicElements
  /** @deprecated Prefer `as`. Kept for older callsites. */
  forwardedAs?: keyof JSX.IntrinsicElements
}

/**
 * LegacyStyledText
 *
 * @deprecated LegacyStyledText has been deprecated. Regarding text, all components should use
 * StyledText with a proper style that the design uses.
 * The existing LegacyStyledText should be replaced with StyledText.
 * Callsites continue to use `as` / `forwardedAs` + `fontWeight`.
 */
export function LegacyStyledText({
  as,
  forwardedAs,
  fontWeight,
  className,
  children,
  style,
  ...props
}: LegacyProps): JSX.Element {
  const styleClassName = resolveLegacyTextStyle({
    as,
    forwardedAs,
    fontWeight,
  })
  const tag = forwardedAs ?? as ?? 'p'
  const stylePropsStyles = styleProps({
    ...props,
    fontWeight,
  })

  const forwardedProps = Object.entries(props).reduce<Record<string, unknown>>(
    (acc, [prop, value]) => {
      if (isntStyleProp(prop)) {
        acc[prop] = value
      }
      return acc
    },
    {}
  )

  return createElement(
    tag,
    {
      ...forwardedProps,
      className: clsx(styleClassName, className),
      style: {
        marginTop: 0,
        marginBottom: 0,
        ...stylePropsStyles,
        ...style,
      },
    },
    children
  )
}
