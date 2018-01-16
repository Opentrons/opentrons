import React from 'react'
import PropTypes from 'prop-types'

import styles from './instrument.css'

InfoItem.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  className: PropTypes.string
}

export default function InfoItem (props) {
  const {title, value, className} = props
  return (
    <div className={className}>
      <h2 className={styles.title}>{title}</h2>
      <span className={styles.value}>{value}</span>
    </div>
  )
}
