import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from './Util.css'

// Disables onClick behavior if props.disabled is true.

const Button = props => (
  <button
    onClick={!props.disabled && props.onClick}
    className={classnames({ [styles.disabled]: props.disabled }, styles.btn, props.style)}
  >
    {props.children}
  </button>
)

Button.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  style: PropTypes.string
}

export default Button
