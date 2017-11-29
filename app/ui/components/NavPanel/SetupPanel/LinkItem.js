import React from 'react'
import {NavLink} from 'react-router-dom'
import styles from './link-list.css'

export default function LinkItem (props) {
  const {url, isDisabled, onClick} = props
  // TODO:(ka 11-29-17) revisit icons once svg files attained
  return (
    <NavLink
      to={url}
      onClick={onClick}
      disabled={isDisabled}
      >
      <span className={styles.icon} />
      <span className={styles.info}>{props.children}</span>
    </NavLink>
  )
}
