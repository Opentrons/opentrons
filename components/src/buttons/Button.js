// @flow
import * as React from 'react'
import cx from 'classnames'
import omit from 'lodash/omit'

import type { HoverTooltipHandlers } from '../tooltips'
import { Icon, type IconName } from '../icons'
import styles from './buttons.css'

export const BUTTON_TYPE_SUBMIT: 'submit' = 'submit'
export const BUTTON_TYPE_RESET: 'reset' = 'reset'
export const BUTTON_TYPE_BUTTON: 'button' = 'button'

export type ButtonProps = {
  /** click handler */
  onClick?: (event: SyntheticMouseEvent<>) => mixed,
  /** name attribute */
  name?: string,
  /** title attribute */
  title?: string,
  /** disabled attribute (setting disabled removes onClick) */
  disabled?: ?boolean,
  /** use hover style even when not hovered */
  hover?: ?boolean,
  /** optional Icon name */
  iconName?: IconName,
  /** classes to apply */
  className?: string,
  /** inverts the default color/background/border of default button style */
  inverted?: boolean,
  /** contents of the button */
  children?: React.Node,
  /** type of button (default "button") */
  type?:
    | typeof BUTTON_TYPE_SUBMIT
    | typeof BUTTON_TYPE_RESET
    | typeof BUTTON_TYPE_BUTTON,
  /** ID of form that button is for */
  form?: string,
  /** custom element or component to use instead of `<button>` */
  Component?: string | React.AbstractComponent<any>,
  /** handlers for HoverTooltipComponent */
  hoverTooltipHandlers?: ?HoverTooltipHandlers,
  /** html tabindex property */
  tabIndex?: number,
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
export function Button(props: ButtonProps) {
  const { name, title, disabled, hover, tabIndex, form } = props
  const className = cx(props.className, { [styles.hover]: hover })
  const onClick = !disabled ? props.onClick : undefined
  const Component = props.Component ?? 'button'
  const type = props.type ?? BUTTON_TYPE_BUTTON

  // pass all props if using a custom component
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
      {props.iconName && <Icon name={props.iconName} className={styles.icon} />}
      {props.children}
    </Component>
  )
}
