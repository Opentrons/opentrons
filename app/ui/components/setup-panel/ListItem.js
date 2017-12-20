import React from 'react'
import PropTypes from 'prop-types'
import {NavLink} from 'react-router-dom'
import classnames from 'classnames'
import styles from './link-list.css'

ListItem.propTypes = {
  url: PropTypes.string,
  isDisabled: PropTypes.bool,
  onClick: PropTypes.func,
  confirmed: PropTypes.bool
}

export default function ListItem (props) {
  const {key, url, isDisabled, onClick, confirmed, active} = props
  // TODO(ka 2017-12-12) replace span with icon style with icon from comp lib
  const style = active && styles.active
  const iconStyle = confirmed
    ? classnames(styles.icon, styles.confirmed)
    : styles.icon

  if (url) {
    return (
      <li key={key}>
        <NavLink
          to={url}
          onClick={onClick}
          disabled={isDisabled}
          activeClassName={styles.active}
          >
          <span className={iconStyle} />
          <span className={styles.info}>{props.children}</span>
        </NavLink>
      </li>
    )
  }

  return (
    <li onClick={onClick} className={style}>
      <span className={iconStyle} />
      <span className={styles.info}>
        {props.children}
      </span>
    </li>
  )
}
