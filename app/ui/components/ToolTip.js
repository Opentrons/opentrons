// tool tip component
import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import styles from './ToolTip.css'

export const TOP = styles.top
export const BOTTOM = styles.bottom
export const BOTTOM_RIGHT = styles.bottom_right
export const LEFT = styles.left
export const RIGHT = styles.right

export const SMALL = styles.small
export const MEDIUM = styles.medium

ToolTip.propTypes = {
  style: PropTypes.oneOf([TOP, BOTTOM, BOTTOM_RIGHT, LEFT, RIGHT]).isRequired,
  size: PropTypes.oneOf([SMALL, MEDIUM])
}

export default function ToolTip (props) {
  const {style, size} = props
  const className = classnames(styles.tooltip, style, size || SMALL)

  return (
    <div className={className}>
      {props.children}
    </div>
  )
}
