import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import NavPanel from './NavPanel'
import grid from './Grid.css'
import styles from './SideBar.css'

const UploadMenu = props => {
  const {onNavClick} = props
  return (
    <section className={styles.upload_menu} onClick={onNavClick}>
      <div className={styles.upload_icon}>
        <img src='../ui/img/icon_file.svg' alt='upload' />
      </div>
    </section>
  )
}

const ConnectionIndicator = props => {
  const {isConnected, onNavClick} = props
  // TODO(mc): handle connection in progress (state is in place for this)
  const style = isConnected
    ? styles.connected
    : styles.disconnected

  return (
    <div className={styles.connection_status} onClick={onNavClick}>
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
  const {isNavPanelOpen, onNavClick, currentNavPanelTask} = props
  return (
    <aside className={classnames(grid.nav_panel, { [grid.open]: isNavPanelOpen })}>
      <nav className={styles.nav_icons}>
        <UploadMenu {...props}/>
        <ConnectionIndicator {...props} />
      </nav>
      <section className={styles.nav_info}>
        <span className={styles.close} onClick={onNavClick}>X</span>
        <NavPanel {...props}/>
      </section>
    </aside>
  )
}
