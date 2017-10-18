import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from '../css/style.css'

// Disables onClick behavior if props.disabled is true.

const Button = props => (
  <button
    onClick={!props.disabled && props.onClick}
    className={classnames({ [styles.disabled]: props.disabled }, styles.btn)}
    id={props.id}
  >
    {props.children}
  </button>
)

Button.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func
}

export default Button
