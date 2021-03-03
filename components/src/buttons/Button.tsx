import * as React from 'react'
import cx from 'classnames'
import omit from 'lodash/omit'

import { Icon } from '../icons'
import styles from './buttons.css'

import {
  BUTTON_TYPE_SUBMIT,
  BUTTON_TYPE_RESET,
  BUTTON_TYPE_BUTTON,
} from '../primitives'

import type { IconName } from '../icons'

interface HoverTooltipHandlers {
  ref: React.Ref<Element>
  'aria-describedby': string
  onMouseEnter: () => unknown
  onMouseLeave: () => unknown
  onPointerEnter: () => unknown
  onPointerLeave: () => unknown
}
export interface ButtonProps {
  /** click handler */
  onClick?: (event: React.MouseEvent) => unknown
  /** name attribute */
  name?: string
  /** title attribute */
  title?: string
  /** disabled attribute (setting disabled removes onClick) */
  disabled?: boolean | null | undefined
  /** use hover style even when not hovered */
  hover?: boolean | null | undefined
  /** optional Icon name */
  iconName?: IconName
  /** classes to apply */
  className?: string
  /** inverts the default color/background/border of default button style */
  inverted?: boolean
  /** contents of the button */
  children?: React.Children
  /** type of button (default "button") */
  type?:
    | typeof BUTTON_TYPE_SUBMIT
    | typeof BUTTON_TYPE_RESET
    | typeof BUTTON_TYPE_BUTTON
  /** ID of form that button is for */
  form?: string
  /** custom element or component to use instead of `<button>` */
  Component?: string | React.Component
  /** handlers for HoverTooltipComponent */
  hoverTooltipHandlers?: Partial<HoverTooltipHandlers> | null | undefined
  /** html tabindex property */
  tabIndex?: number
}

// props to strip if using a custom component
const STRIP_PROPS = [
  'inverted',
  'iconName',
  'children',
  'Component',
  'hoverTooltipHandlers',
]

/**
 * Basic, un-styled button. You probably want to use a styled button
 * instead. All buttons take the same props.
 *
 * If you need access to the ButtonProps type, you can:
 * ```js
 * import {type ButtonProps} from '@opentrons/components'
 * ```
 */
export function Button(props: ButtonProps): JSX.Element {
  const { name, title, disabled, hover, tabIndex, form } = props
  const className = cx(props.className, { [styles.hover]: hover })
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  const onClick = !disabled ? props.onClick : undefined
  const Component = props.Component ?? 'button'
  const type = props.type ?? BUTTON_TYPE_BUTTON

  // pass all props if using a custom component
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  const buttonProps = !props.Component
    ? { name, type, form, title, disabled, onClick, className, tabIndex }
    : {
        ...omit(props, STRIP_PROPS),
        className: cx(className, { [styles.disabled]: disabled }),
        onClick,
      }

  // TODO(mc, 2019-04-02): hoverTooltipHandlers should probably be named more
  // generically, and the Button component should probably be configured as a
  // ref forwarder
  return (
    <Component {...props.hoverTooltipHandlers} {...buttonProps}>
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      {props.iconName && <Icon name={props.iconName} className={styles.icon} />}
      {props.children}
    </Component>
  )
}
