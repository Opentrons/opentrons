import React from 'react'
import {NavLink} from 'react-router-dom'
import classnames from 'classnames'
import styles from './link-list.css'

export default function LinkItem (props) {
  const {url, isDisabled, onClick, confirmed} = props
  const style = confirmed
  ? classnames(styles.icon, styles.confirmed)
  : styles.icon
  // TODO:(ka 11-29-17) revisit icons once svg files attained
  return (
    <NavLink
      to={url}
      onClick={onClick}
      disabled={isDisabled}
      className={styles.confirmed}
      >
      <span className={style} />
      <span className={styles.info}>{props.children}</span>
    </NavLink>
  )
}
