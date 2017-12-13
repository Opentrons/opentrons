import React from 'react'
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom'
import styles from './run-panel.css'

RunLink.propTypes = {
  to: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func
}

// another prospect for buttons.js in component lib. LinkButton or ButtonLink?
export default function RunLink (props) {
  const {to, onClick, disabled} = props
  return (
    <Link
      to={to}
      disabled={disabled}
      onClick={onClick}
      className={styles.run_link}
    >
      Run Protocol
    </Link>
  )
}
