// @flow
import cx from 'classnames'
import * as React from 'react'

import type { UseHoverTooltipResult } from '../tooltips'
import styles from './Pill.css'

export type PillProps = {|
  /** background color of pill (any CSS color string) */
  color?: ?string,
  /** text black, instead of default white */
  invertTextColor?: ?boolean,
  /** additional class name */
  className?: string,
  /** contents of the pill */
  children?: React.Node,
  /** handlers for HoverTooltipComponent */
  hoverTooltipHandlers?: ?$ElementType<UseHoverTooltipResult, 0>,
|}

/**
 * Colored Pill containing text or other contents
 */
export function Pill(props: PillProps): React.Node {
  const className = cx(styles.pill, props.className, {
    [styles.invert_text]: props.invertTextColor,
  })
  const { color, children, hoverTooltipHandlers } = props

  return (
    <span
      style={{ backgroundColor: color }}
      className={className}
      {...hoverTooltipHandlers}
    >
      {children}
    </span>
  )
}
