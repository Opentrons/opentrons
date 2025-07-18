import { createElement } from 'react'

import { styleProps } from '../primitives'

import type { ComponentProps, ComponentType } from 'react'
import type { StyleProps } from '../primitives'

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
  const ComponentWithStyleProps = ({
    style,
    ...props
  }: ComponentProps<T> & StyleProps): JSX.Element => {
    const stylePropsStyles = styleProps(props)
    const combinedStyles = { ...stylePropsStyles, ...style }

    return createElement(Component, {
      ...props,
      style: combinedStyles,
    })
  }

  ComponentWithStyleProps.displayName = `withStyleProps(${
    Component.displayName ?? Component.name
  })`

  return ComponentWithStyleProps as any
}
