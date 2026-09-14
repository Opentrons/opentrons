import { createElement, forwardRef } from 'react'

import { isntStyleProp, styleProps } from '../primitives/style-props'

import type {
  ComponentProps,
  ComponentType,
  ForwardedRef,
  ReactNode,
} from 'react'
import type { StyleProps } from '../primitives/types'

/**
 * A Higher-Order Component (HOC) that enhances a component by enabling it to
 * accept `StyleProps`.
 *
 * This function wraps a component, processes any provided `StyleProps` into a
 * React style object, and merges it with the component's existing `style` prop.
 * Styles from the passed `style` prop will override any generated styles from `StyleProps`
 * in case of conflict.
 *
 * @template T - The type of the React component being wrapped.
 * @param Component The React component to enhance with `StyleProps`.
 * @returns A new component that accepts the original component's props plus `StyleProps`.
 *
 * @example
 * ```tsx
 * <Icon
 *  name="wifi"
 *  size="1.25rem"
 *  color={COLORS.green50}
 *  style={{ marginLeft: SPACING.spacing8 }}
 *  />
 * ```
 */

export function withStyleProps<T extends ComponentType<any>>(
  Component: T
): T & ComponentType<ComponentProps<T> & StyleProps> {
  const ComponentWithStyleProps = forwardRef(
    (
      { style, ...props }: ComponentProps<T> & StyleProps,
      ref: ForwardedRef<unknown>
    ): ReactNode => {
      const stylePropsStyles = styleProps(props)
      const combinedStyles = { ...stylePropsStyles, ...style }

      const forwardedProps = Object.entries(props).reduce(
        (acc: Record<string, unknown>, [prop, value]) => {
          if (isntStyleProp(prop)) {
            acc[prop] = value
          }
          return acc
        },
        {}
      )

      return createElement(Component, {
        ...(forwardedProps as ComponentProps<T>),
        ref,
        style: combinedStyles,
      })
    }
  )

  ComponentWithStyleProps.displayName = `withStyleProps(${
    Component.displayName ?? Component.name
  })`

  return ComponentWithStyleProps as any
}
