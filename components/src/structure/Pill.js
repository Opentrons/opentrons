// @flow
import * as React from 'react'
import cx from 'classnames'
import type {HoverTooltipHandlers} from '../tooltips'
import styles from './Pill.css'

type Props = {
  /** background color of pill (any CSS color string) */
  color?: ?string,
  /** text black, instead of default white */
  invertTextColor?: ?boolean,
  /** additional class name */
  className?: string,
  /** contents of the pill */
  children?: React.Node,
  /** handlers for HoverTooltipComponent */
  hoverTooltipHandlers?: ?HoverTooltipHandlers,
}

/**
 * Colored Pill containing text or other contents
 */
function Pill (props: Props) {
  const className = cx(
    styles.pill,
    props.className,
    {[styles.invert_text]: props.invertTextColor}
  )
  const {color, children, hoverTooltipHandlers} = props
  return (
    <span
      style={{backgroundColor: color}}
      className={className}
      {...hoverTooltipHandlers}>
      {children}
    </span>
  )
}

export default Pill
