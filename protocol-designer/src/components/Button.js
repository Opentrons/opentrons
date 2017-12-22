import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const styles = {} // HACK Ian 2017-12-06 until we get Button component in component library

// Disables onClick behavior if props.disabled is true.
Button.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func
}

export default function Button ({disabled, onClick, className, ...otherProps}) {
  return (
    <button
      onClick={!disabled && onClick}
      className={classnames({ [styles.disabled]: disabled }, styles.btn, className)}
      // TODO Ian 2017-11-17 don't spread props into DOM <button>
      {...otherProps}
    />
  )
}
