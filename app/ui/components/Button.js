import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

// Disables onClick behavior if props.disabled is true.

const Button = props => (
  <button
    onClick={!props.disabled && props.onClick}
    className={classnames('btn', {'disabled': props.disabled}, props.style)}
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
