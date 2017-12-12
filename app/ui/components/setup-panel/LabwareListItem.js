import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import ToolTip, {BOTTOM_RIGHT} from '../ToolTip'

import styles from './setup-panel.css'
import tooltipStyles from '../ToolTip.css'

LabwareListItem.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  style: PropTypes.string
}

export default function LabwareListItem (props) {
  const {
    name,
    confirmed,
    isTiprack,
    instrumentsCalibrated,
    tipracksConfirmed,
    onClick
  } = props

  const isDisabled = !instrumentsCalibrated || !(isTiprack || tipracksConfirmed)

  const buttonStyle = classnames(styles.btn_labware, {
    // tipracks can only be confirmed once because of the whole pick-up process
    [styles.disabled]: isDisabled || (isTiprack && confirmed)
  })

  const statusStyle = classnames({
    [styles.confirmed]: confirmed,
    [styles.alert]: !confirmed
  })
  // TODO(ka 2017-12-12) convert labware items to navlink and wrap component lib list item
  // leaving this here for now to avoid lapse in functionality
  return (
    <li>
      <button
        className={buttonStyle}
        onClick={onClick}
        disabled={isDisabled}
      >
        <span className={classnames(statusStyle, tooltipStyles.parent)}>
          <ToolTip style={BOTTOM_RIGHT}>Position unconfirmed</ToolTip>
        </span>
        {name}
      </button>
    </li>
  )
}
