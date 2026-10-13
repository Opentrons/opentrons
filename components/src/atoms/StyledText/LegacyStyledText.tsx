import { createElement } from 'react'
import clsx from 'clsx'

import { isntStyleProp, styleProps } from '../../primitives/style-props'
import { resolveLegacyTextStyle } from './legacyTextStyles'

import type { ComponentProps, ReactNode } from 'react'
import type { StyleProps } from '../../primitives/types'
import type { LegacyTextStyle } from './legacyTextStyles'

export interface LegacyProps
  extends StyleProps, Omit<ComponentProps<'p'>, 'color' | 'as'> {
  children?: ReactNode
  /** kebab-case legacy style key, e.g. `legacy-h3-bold`. */
  textStyle?: LegacyTextStyle
  as?: keyof JSX.IntrinsicElements
  /** @deprecated Prefer `as`. Kept for older callsites. */
  forwardedAs?: keyof JSX.IntrinsicElements
}

/**
 * LegacyStyledText
 *
 * @deprecated LegacyStyledText has been deprecated. Regarding text, all components should use
 * StyledText with a proper style that the design uses.
 * The existing LegacyStyledText should be replaced with StyledText,
 * Existing callsites may use `as` + `fontWeight`, or the new `textStyle`
 * string API (`legacy-h3-bold`, `legacy-caption-regular`, …).
 */
export function LegacyStyledText({
  textStyle,
  as,
  forwardedAs,
  fontWeight,
  className,
  children,
  style,
  ...props
}: LegacyProps): JSX.Element {
  const { as: defaultAs, className: styleClassName } = resolveLegacyTextStyle({
    textStyle,
    as,
    forwardedAs,
    fontWeight,
  })
  const tagProp = forwardedAs ?? as
  const tag = typeof tagProp === 'string' ? tagProp : defaultAs

  // fontWeight selects the legacy class when textStyle is omitted
  const stylePropsStyles = styleProps({
    ...props,
    ...(textStyle != null ? { fontWeight } : {}),
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
