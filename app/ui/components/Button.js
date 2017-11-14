import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

// disables onClick behavior if props.disabled is true.
const Button = props => (
  <button
    onClick={!props.disabled && props.onClick}
    className={classnames('btn', props.style, {disabled: props.disabled})}
    title={props.title}
  >
    {props.children}
  </button>
)

Button.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  // TODO(mc, 2017-11-13): rename to className
  style: PropTypes.string,
  title: PropTypes.string
}

export default Button
