// side bar link
import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import ToolTip, {MEDIUM, RIGHT} from '../ToolTip'
import styles from './nav-bar.css'

SideBarButton.propTypes = {
  title: PropTypes.string.isRequired,
  isCurrent: PropTypes.bool.isRequired,
  src: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

export default function SideBarButton (props) {
  const {title, isCurrent, src, onClick, disabled} = props
  const className = classnames(styles.button, {[styles.active]: isCurrent})

  return (
    <button
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      <img aria-hidden='true' className={styles.icon} src={src} />
      <ToolTip size={MEDIUM} style={RIGHT}>{title}</ToolTip>
    </button>
  )
}
