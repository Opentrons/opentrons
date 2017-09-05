import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import NavPanel from './NavPanel'
import grid from './Grid.css'
import styles from './SideBar.css'

const UploadMenu = props => {
  const {onNavIconClick} = props
  return (
    <section className={styles.upload_menu} onClick={onNavIconClick('upload')}>
      <div className={styles.upload_icon}>
        <img src='../ui/img/icon_file.svg' alt='upload' />
      </div>
    </section>
  )
}

// TODO: (ka) these are just placeholder icons, refactor to reuse same component for upload, design, setup
// with icon, style, and handler as props
const DesignMenu = props => {
  const {onNavIconClick} = props
  return (
    <section className={styles.design_menu} onClick={onNavIconClick('design')}>
      <div className={styles.design_icon}>
        <img src='../ui/img/icon_design.svg' alt='design' />
      </div>
    </section>
  )
}

const SetupMenu = props => {
  const {onNavIconClick} = props
  return (
    <section className={styles.setup_menu} onClick={onNavIconClick('setup')}>
      <div className={styles.setup_icon}>
        <img src='../ui/img/icon_setup.svg' alt='setup' />
      </div>
    </section>
  )
}

const ConnectionIndicator = props => {
  const {isConnected, onNavIconClick} = props
  // TODO(mc): handle connection in progress (state is in place for this)
  const style = isConnected
    ? styles.connected
    : styles.disconnected

  return (
    <div className={styles.connection_status} onClick={onNavIconClick('connect')}>
      <div className={styles.status}>
        <div className={style} />
      </div>
    </div>
  )
}

ConnectionIndicator.propTypes = {
  isConnected: PropTypes.bool.isRequired
}

export default function SideBar (props) {
  const {isNavPanelOpen, onNavClick} = props
  return (
    <aside className={classnames(grid.nav_panel, { [grid.open]: isNavPanelOpen })}>
      <nav className={styles.nav_icons} >
        <UploadMenu {...props} />
        <DesignMenu {...props} />
        <SetupMenu {...props} />
        <ConnectionIndicator {...props} />
      </nav>
      <section className={styles.nav_info}>
        <span className={styles.close} onClick={onNavClick}>X</span>
        <NavPanel {...props} />
      </section>
    </aside>
  )
}
