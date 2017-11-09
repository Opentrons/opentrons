// collapsable side panel
import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import styles from './nav-panel.css'

SidePanel.propTypes = {
  title: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired
}

export default function SidePanel (props) {
  const {title, isOpen, close} = props
  const className = classnames(styles.panel, {[styles.closed]: !isOpen})

  return (
    <div className={className}>
      <div className={styles.title_bar}>
        <h2 className={styles.title}>
          {title}
        </h2>
        <button className={styles.close_button} title='Close' onClick={close}>
          X
        </button>
      </div>
      <div className={styles.panel_contents}>
        {props.children}
      </div>
    </div>
  )
}
