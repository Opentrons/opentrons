import React from 'react'
import {NavLink} from 'react-router-dom'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import capitalize from 'lodash/capitalize'
import ToolTip from './ToolTip'
import styles from './SetupPanel.css'

import {constants as robotConstants} from '../robot'

function PipetteLinks (props) {
  const {axis, name, volume, channels, calibration, onClick} = props
  const isDisabled = name == null
  const url = `/setup-instruments/${axis}`

  const linkStyle = classnames({[styles.disabled]: isDisabled})

  const statusStyle = isDisabled || calibration === robotConstants.PROBED
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
        <span className={classnames(statusStyle, 'tooltip_parent')}>
          <ToolTip msg='Tip not found' pos='bottom' />
        </span>
        <span className={styles.axis}>{axis}</span>
        <span className={styles.type}>{description}</span>
      </NavLink>
    </li>
  )
}

function LabwareLinks (props) {
  const {name, calibration, isTiprack, tipracksConfirmed, onClick} = props
  const isDisabled = !isTiprack && !tipracksConfirmed
  const isConfirmed = calibration === robotConstants.CONFIRMED

  const buttonStyle = classnames(styles.btn_labware, {
    [styles.disabled]: isDisabled
  })

  const statusStyle = classnames({
    [styles.confirmed]: isConfirmed,
    [styles.alert]: !isConfirmed
  })

  return (
    <li>
      <button
        className={buttonStyle}
        onClick={onClick}
        disabled={isDisabled}
      >
        <span className={classnames(statusStyle, 'tooltip_parent')}>
          <ToolTip msg='Position unconfirmed' pos='bottom' />
        </span>
        {name}
      </button>
    </li>
  )
}

export default function SetupPanel (props) {
  const {
    instruments,
    labware,
    instrumentsCalibrated,
    labwareConfirmed,
    tipracksConfirmed,
    setLabware,
    clearLabwareReviewed
  } = props

  const instrumentList = instruments.map((i) => (
    <PipetteLinks {...i} key={i.axis} onClick={clearLabwareReviewed} />
  ))

  const {tiprackList, labwareList} = labware.reduce((result, lab) => {
    const {slot, name, isTiprack} = lab
    const onClick = setLabware(slot)

    const links = (
      <LabwareLinks
        {...lab}
        key={slot}
        tipracksConfirmed={tipracksConfirmed}
        onClick={onClick}
      />
    )

    if (name && isTiprack) {
      result.tiprackList.push(links)
    } else if (name) {
      result.labwareList.push(links)
    }

    return result
  }, {tiprackList: [], labwareList: []})

  const runLinkStyles = classnames({[styles.inactive]: !labwareConfirmed}, styles.run_link, 'tooltip_parent')
  const runLinkWarning = 'Pipette and labware setup must be complete before you can RUN protocol'
  const labwareMsg = !instrumentsCalibrated
    ? <p className={styles.labware_alert}>Labware setup is disabled until pipette setup is complete.</p>
    : null
  const pipetteMsg = !tipracksConfirmed && instrumentsCalibrated
    ? <p className={styles.labware_alert}>Tipracks must be setup first.</p>
    : null

  return (
    <div className={styles.setup_panel}>
      <h1>Prepare Robot for RUN</h1>
      <section className={styles.links}>
        <section className={styles.pipette_group}>
          <h3>Pipette Setup</h3>
          <ul className={styles.step_list}>
            {instrumentList}
          </ul>
        </section>
        <section className={styles.labware_group}>
          <h3>Labware Setup</h3>
          <ul className={classnames({[styles.unavailable]: !instrumentsCalibrated}, styles.step_list)}>
            {tiprackList}
            {labwareList}
          </ul>
          {pipetteMsg}
          {labwareMsg}
        </section>
      </section>
      <NavLink to='/run' className={runLinkStyles}>
        Run Protocol
        <ToolTip msg={runLinkWarning} pos='top' />
      </NavLink>
    </div>
  )
}

SetupPanel.propTypes = {
  instruments: PropTypes.arrayOf(PropTypes.shape({
    axis: PropTypes.string.isRequired,
    name: PropTypes.string,
    channels: PropTypes.string,
    volume: PropTypes.number,
    calibration: PropTypes.oneOf([
      robotConstants.UNPROBED,
      robotConstants.PREPARING_TO_PROBE,
      robotConstants.READY_TO_PROBE,
      robotConstants.PROBING,
      robotConstants.PROBED
    ])
  })).isRequired,
  labware: PropTypes.arrayOf(PropTypes.shape({
    slot: PropTypes.number.isRequired,
    name: PropTypes.string,
    type: PropTypes.string,
    isTiprack: PropTypes.bool,
    calibration: PropTypes.oneOf([
      robotConstants.UNCONFIRMED,
      robotConstants.MOVING_TO_SLOT,
      robotConstants.OVER_SLOT,
      robotConstants.CONFIRMED
    ])
  })).isRequired,
  clearLabwareReviewed: PropTypes.func.isRequired,
  instrumentsCalibrated: PropTypes.bool.isRequired,
  tipracksConfirmed: PropTypes.bool.isRequired,
  labwareConfirmed: PropTypes.bool.isRequired
}
