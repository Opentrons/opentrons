import React from 'react'
import {Link} from 'react-router-dom'
import styles from './run-panel.css'
// another prospect for buttons.js in component lib. LinkButton or ButtonLink?
export default function (props) {
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
