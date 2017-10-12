import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import NavPanel from './NavPanel'
import styles from './SideBar.css'

function NavLink (props) {
  const {name, iconSrc, onClick, isDisabled, isActive, msg} = props
  return (
    <li key={name}>
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={classnames({[styles.active]: isActive}, styles.nav_icon)}
      >
        <img src={iconSrc} alt={name} />
      </button>
      <ToolTip msg={msg} />
    </li>
  )
}

function ToolTip (props) {
  const {msg} = props
  return (
    <span className={styles.tooltip}>{msg}</span>
  )
}

const ConnectionIndicator = props => {
  const {isConnected, onNavIconClick, isActive} = props
  // TODO(mc): handle connection in progress (state is in place for this)
  const style = isConnected
    ? styles.connected
    : styles.disconnected
  const toolTipMessage = 'Connect Robot'
  return (
    <div className={classnames({[styles.active]: isActive}, styles.connection_status)} onClick={onNavIconClick('connect')}>
      <div className={styles.status}>
        <div className={style} />
      </div>
      <ToolTip msg={toolTipMessage} />
    </div>
  )
}

ConnectionIndicator.propTypes = {
  isConnected: PropTypes.bool.isRequired
}

export default function SideBar (props) {
  const {isNavPanelOpen, onNavIconClick, currentNavPanelTask} = props
  const style = classnames(styles.sidebar, {[styles.open]: isNavPanelOpen})
  const navLinks = props.navLinks.map((link) => NavLink({
    onClick: onNavIconClick(link.name),
    ...link
  }))

  const connectIsActive = isNavPanelOpen && currentNavPanelTask === 'connect'

  return (
    <div className={style}>
      <nav className={styles.nav_icons} >
        <ol className={styles.nav_icon_list}>
          {navLinks}
        </ol>
        <ConnectionIndicator {...props} isActive={connectIsActive} />
      </nav>
      <section className={styles.nav_info}>
        <NavPanel {...props} />
      </section>
    </div>
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
  toggleNavOpen: PropTypes.func.isRequired,
  onNavIconClick: PropTypes.func.isRequired,
  currentNavPanelTask: PropTypes.string.isRequired
}
