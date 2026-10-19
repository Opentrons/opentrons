import { createElement } from 'react'
import clsx from 'clsx'

import { isntStyleProp, styleProps } from '../../primitives/style-props'
import { resolveLegacyTextStyle } from './legacyTextStyles'
import {
  resolveStyledTextStyles,
  resolveStyledTextTag,
} from './styledTextStyles'

import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import type { StyleProps } from '../../primitives/types'
import type { DesktopStyles, ODDStyles } from './styledTextStyles'

export type { DesktopStyles, ODDStyles } from './styledTextStyles'
export { DESKTOP_STYLES as HELIX_STYLES, ODD_STYLES } from './styledTextStyles'

export interface Props extends ComponentProps<'p'>, StyleProps {
  as?: keyof JSX.IntrinsicElements
  /** @deprecated Prefer `as`. For LegacyStyledText migration. */
  forwardedAs?: keyof JSX.IntrinsicElements
  oddStyle?: ODDStyles
  desktopStyle?: DesktopStyles
  children?: ReactNode
  htmlFor?: string
}

/**
 * StyledText — prefer `desktopStyle` / `oddStyle` for Helix / ODD typography.
 * Without those, falls back to LegacyStyledText logic: `as` / `forwardedAs` +
 * `fontWeight` → legacy CSS-module classes.
 */
export function StyledText({
  oddStyle,
  desktopStyle,
  as,
  forwardedAs,
  fontWeight,
  className,
  children,
  style,
  ...props
}: Props): JSX.Element {
  const useLegacyStyles = desktopStyle == null && oddStyle == null

  const modernStyles = useLegacyStyles
    ? null
    : resolveStyledTextStyles({ desktopStyle, oddStyle })

  const legacyClassName = useLegacyStyles
    ? resolveLegacyTextStyle({ as, forwardedAs, fontWeight })
    : null

  const tag = useLegacyStyles
    ? (forwardedAs ?? as ?? 'p')
    : (as ?? resolveStyledTextTag({ desktopStyle, oddStyle }))

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

  const combinedStyle: CSSProperties = {
    ...stylePropsStyles,
    ...modernStyles?.style,
    ...style,
  }

  return createElement(
    tag,
    {
      ...forwardedProps,
      className: clsx(modernStyles?.className, legacyClassName, className),
      style: combinedStyle,
    },
    children
  )
}
