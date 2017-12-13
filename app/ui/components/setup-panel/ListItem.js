import React from 'react'
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom'
import classnames from 'classnames'
import styles from './link-list.css'

ListItem.propTypes = {
  url: PropTypes.string,
  isDisabled: PropTypes.bool,
  onClick: PropTypes.func,
  confirmed: PropTypes.bool
}

export default function ListItem (props) {
  const {key, url, isDisabled, onClick, confirmed} = props
  // TODO(ka 2017-12-12) replace span with icon style with icon from comp lib
  const iconStyle = confirmed
    ? classnames(styles.icon, styles.confirmed)
    : styles.icon

  if (url) {
    return (
      <li key={key}>
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
