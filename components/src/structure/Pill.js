// @flow
import * as React from 'react'
import cx from 'classnames'
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
  // TODO LATER Ian 2018-04-11 mouse event handlers (eg for triggering tooltip)
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

  return <span
    style={{backgroundColor: props.color}}
    className={className}
  >
    {props.children}
  </span>
}

export default Pill
