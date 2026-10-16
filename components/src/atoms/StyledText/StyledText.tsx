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
  /**
   * Optional semantic HTML tag override. When omitted with `desktopStyle` /
   * `oddStyle`, the tag is derived from those styles. With legacy usage
   * (`as` / `forwardedAs` + `fontWeight` only), defaults to `p`.
   */
  as?: keyof JSX.IntrinsicElements
  /** @deprecated Prefer `as`. Kept so LegacyStyledText callsites can migrate. */
  forwardedAs?: keyof JSX.IntrinsicElements
  oddStyle?: ODDStyles
  desktopStyle?: DesktopStyles
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

  return createElement(
    tag,
    {
      ...forwardedProps,
      className: clsx(modernStyles?.className, legacyClassName, className),
      style: {
        ...stylePropsStyles,
        ...modernStyles?.style,
        ...style,
      } as CSSProperties,
    },
    children as ReactNode
  )
}
