// @flow
import * as React from 'react'
import cx from 'classnames'
import omit from 'lodash/omit'

import type {HoverTooltipHandlers} from '../tooltips'
import {Icon, type IconName} from '../icons'
import styles from './buttons.css'

export type ButtonProps = {
  /** click handler */
  onClick?: (event: SyntheticMouseEvent<>) => mixed,
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
  type?: 'submit' | 'reset' | 'button',
  /** custom element or component to use instead of `<button>` */
  Component?: React.ElementType,
  /** handlers for HoverTooltipComponent */
  hoverTooltipHandlers?: ?HoverTooltipHandlers,
  /** html tabindex property */
  tabIndex?: number,
  /** optional ref to pass to <button> */
  buttonRef?: {current: null | HTMLButtonElement},
}

// props to strip if using a custom component
const STRIP_PROPS = [
  'inverted',
  'iconName',
  'children',
  'Component',
  'buttonRef',
]

/**
 * Basic, unstyled button. You probably want to use a styled button
 * instead. All buttons take the same props.
 *
 * If you need access to the ButtonProps type, you can:
 * ```js
 * import {type ButtonProps} from '@opentrons/components'
 * ```
 */
export default function Button (props: ButtonProps) {
  const {title, disabled, hover, tabIndex, Component} = props
  const className = cx(props.className, {[styles.hover]: hover})
  const onClick = !disabled ? props.onClick : undefined
  const type = props.type || 'button'
  const ref = props.buttonRef
  const children = (
    <React.Fragment>
      {props.iconName && <Icon name={props.iconName} className={styles.icon} />}
      {props.children}
    </React.Fragment>
  )

  return Component ? (
    <Component
      {...{
        ...props.hoverTooltipHandlers,
        ...omit(props, STRIP_PROPS),
        className: cx(className, {[styles.disabled]: disabled}),
        onClick,
      }}
    >
      {children}
    </Component>
  ) : (
    <button
      {...{
        ...props.hoverTooltipHandlers,
        type,
        title,
        disabled,
        onClick,
        className,
        tabIndex,
      }}
      ref={ref}
    >
      {children}
    </button>
  )
}
