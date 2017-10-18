import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default function ToolTip (props) {
  const {msg, pos} = props
  const style = `tooltip_${pos}`
  return (
    <span className={classnames('tooltip', style)}>{msg}</span>
  )
}

ToolTip.propTypes = {
  msg: PropTypes.string.isRequired,
  pos: PropTypes.string.isRequired
}
