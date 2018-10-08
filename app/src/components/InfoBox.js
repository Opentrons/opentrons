import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import styles from './InfoBox.css'

InfoBox.propTypes = {
  className: PropTypes.string,
  onCancelClick: PropTypes.func,
}

export default function InfoBox (props) {
  const {className, onCancelClick} = props
  let cancelButton = null

  if (onCancelClick) {
    cancelButton = (
      <span role='button' onClick={onCancelClick} className={styles.close}>
        X
      </span>
    )
  }

  return (
    <div className={classnames(styles.info_box, className)}>
      {cancelButton}
      {props.children}
    </div>
  )
}
