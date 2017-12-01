import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import NavPanel from './NavPanel'
import styles from './SideBar.css'

export default function SideBar (props) {
  const {isOpen, close} = props
  const style = classnames(styles.sidebar, {[styles.closed]: !isOpen})

  return (
    <div className={style}>
      <section className={styles.nav_info}>
        <span className={styles.close} onClick={close}>X</span>
        <NavPanel {...props} />
      </section>
    </div>
  )
}

SideBar.propTypes = {
  isPanelOpen: PropTypes.bool,
  close: PropTypes.func.isRequired
}
