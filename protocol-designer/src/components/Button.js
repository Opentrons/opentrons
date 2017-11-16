import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from '../css/style.css'

// Disables onClick behavior if props.disabled is true.

const Button = ({disabled, onClick, className, ...otherProps}) => (
  <button
    onClick={!disabled && onClick}
    className={classnames({ [styles.disabled]: disabled }, styles.btn, className)}
    {...otherProps}
  />
)

Button.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func
}

export default Button
