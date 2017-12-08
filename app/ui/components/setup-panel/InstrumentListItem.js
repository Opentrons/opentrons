import React from 'react'
import {NavLink} from 'react-router-dom'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import capitalize from 'lodash/capitalize'

import ToolTip, {BOTTOM_RIGHT} from '../ToolTip'

import styles from './setup-panel.css'
import tooltipStyles from '../ToolTip.css'

// TODO(ka 2017-12-8) This will move to LinkItem in component lib
// with more generic proptypes and props.children
InstrumentListItem.propTypes = {
  to: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  style: PropTypes.string
}

export default function InstrumentListItem (props) {
  const {axis, name, volume, channels, probed, isRunning, onClick} = props
  const isDisabled = name == null
  const url = isRunning
    ? '#'
    : `/setup-instruments/${axis}`

  const linkStyle = classnames({[styles.disabled]: isDisabled})

  const statusStyle = isDisabled || probed
    ? styles.confirmed
    : styles.alert

  const description = !isDisabled
    ? `${capitalize(channels)}-channel (${volume} ul)`
    : 'N/A'

  return (
    <li>
      <NavLink
        to={url}
        onClick={onClick}
        className={linkStyle}
        activeClassName={styles.active}
        disabled={isDisabled}
      >
        <span className={classnames(statusStyle, tooltipStyles.parent)}>
          <ToolTip style={BOTTOM_RIGHT}>Tip not found</ToolTip>
        </span>
        <span className={styles.axis}>{axis}</span>
        <span className={styles.type}>{description}</span>
      </NavLink>
    </li>
  )
}
