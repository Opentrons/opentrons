import React from 'react'
import {Link} from 'react-router-dom'
import classnames from 'classnames'
import styles from './link-list.css'

export default function LinkItem (props) {
  const {url, isDisabled, onClick, confirmed} = props
  // TODO(ka 2017-12-12) replace span with icon style with icon from comp lib
  const iconStyle = confirmed
    ? classnames(styles.icon, styles.confirmed)
    : styles.icon

  if (url) {
    return (
      <li>
        <Link
          to={url}
          onClick={onClick}
          disabled={isDisabled}
          >
          <span className={iconStyle} />
          <span className={styles.info}>{props.children}</span>
        </Link>
      </li>
    )
  }

  return (
    <li onClick={onClick}>
      <span className={iconStyle} />
      <span className={styles.info}>
        {props.children}
      </span>
    </li>
  )
}
