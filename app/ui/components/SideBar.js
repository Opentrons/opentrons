import React from 'react'
import {NavLink} from 'react-router-dom'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import NavPanel from './NavPanel'
import styles from './SideBar.css'

function NavigationLink (props) {
  const {name, iconSrc, onClick, isDisabled, to} = props

  return (
    <li key={name}>
      <NavLink
        to={to}
        onClick={onClick}
        disabled={isDisabled}
        className={styles.nav_icon}
        activeClassName={styles.active_step}
      >
        <img src={iconSrc} alt={name} />
      </NavLink>
    </li>
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
  const {isNavPanelOpen, onNavIconClick} = props
  const navLinks = props.navLinks.map((link) => NavigationLink({
    onClick: onNavIconClick(link.name),
    ...link
  }))

  return (
    <aside className={classnames(styles.sidebar, { [styles.open]: isNavPanelOpen })}>
      <nav className={styles.nav_icons} >
        <ConnectionIndicator {...props} />
        <ol className={styles.nav_icon_list}>
          {navLinks}
        </ol>
      </nav>
      <section className={styles.nav_info}>
        <NavPanel {...props} />
      </section>
    </aside>
  )
}

SideBar.propTypes = {
  navLinks: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    iconSrc: PropTypes.string.isRequired,
    isDisabled: PropTypes.bool.isRequired
  })).isRequired,
  isConnected: PropTypes.bool.isRequired,
  isNavPanelOpen: PropTypes.bool.isRequired,
  onNavClick: PropTypes.func.isRequired
}
