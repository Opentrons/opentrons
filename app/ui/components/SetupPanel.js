import React from 'react'
import {NavLink} from 'react-router-dom'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import capitalize from 'lodash/capitalize'

import {constants as robotConstants} from '../robot'
import ToolTip, {TOP, BOTTOM_RIGHT} from './ToolTip'
import InfoBox from './InfoBox'
import styles from './SetupPanel.css'
import tooltipStyles from './ToolTip.css'

function PipetteLinks (props) {
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

function LabwareLinks (props) {
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

export default function SetupPanel (props) {
  const {
    instruments,
    labware,
    instrumentsCalibrated,
    labwareConfirmed,
    tipracksConfirmed,
    setLabware,
    clearLabwareReviewed,
    isRunning,
    run
  } = props

  const instrumentList = instruments.map((i) => (
    <PipetteLinks
      {...i}
      key={i.axis}
      isRunning={isRunning}
      onClick={!isRunning && clearLabwareReviewed}
    />
  ))

  const {tiprackList, labwareList} = labware.reduce((result, lab) => {
    const {slot, name, isTiprack} = lab
    const onClick = setLabware(slot)

    const links = (
      <LabwareLinks
        {...lab}
        key={slot}
        instrumentsCalibrated={instrumentsCalibrated}
        tipracksConfirmed={tipracksConfirmed}
        onClick={!isRunning && onClick}
      />
    )

    if (name && isTiprack) {
      result.tiprackList.push(links)
    } else if (name) {
      result.labwareList.push(links)
    }

    return result
  }, {tiprackList: [], labwareList: []})

  const runLinkStyles = classnames(
    'btn',
    'btn_dark',
    styles.run_link,
    tooltipStyles.parent,
    {[styles.inactive]: !labwareConfirmed}
  )

  const runLinkWarning = 'Pipette and labware setup\nmust be complete before\nyou can RUN protocol'
  const labwareMsg = !instrumentsCalibrated
    ? <p className={styles.labware_alert}>Labware setup is disabled until pipette setup is complete.</p>
    : null
  const pipetteMsg = !tipracksConfirmed && instrumentsCalibrated
    ? <p className={styles.labware_alert}>Tipracks must be setup first.</p>
    : null

  const runWarning = !labwareConfirmed
    ? <ToolTip style={TOP}>{runLinkWarning}</ToolTip>
    : null

  const runLinkUrl = labwareConfirmed
    ? '/run'
    : '#'

  const runMessage = labwareConfirmed
    ? <RunMessage />
    : null

  const onRunClick = labwareConfirmed && !isRunning
    ? run
    : null

  return (
    <div className={styles.setup_panel}>
      <section className={styles.links}>
        <section className={styles.pipette_group}>
          <h3>Pipette Setup</h3>
          <ul className={styles.step_list}>
            {instrumentList}
          </ul>
        </section>
        <section className={styles.labware_group}>
          <h3>Labware Setup</h3>
          <ul className={styles.step_list}>
            {tiprackList}
            {labwareList}
          </ul>
          {pipetteMsg}
          {labwareMsg}
          {runMessage}
        </section>
      </section>
      <NavLink to={runLinkUrl} className={runLinkStyles} onClick={onRunClick}>
        Run Protocol
        {runWarning}
      </NavLink>
    </div>
  )
}

function RunMessage () {
  return (
    <InfoBox className={styles.run_message}>
      <p className={styles.run_message_item}>
        Hurray, your robot is now ready! Click [RUN PROTOCOL] to start your run.
      </p>
      <p className={styles.run_message_item}>
        Tip: Try a dry run prior to adding your samples and re-agents to avoid
        wasting materials.
      </p>
    </InfoBox>
  )
}

SetupPanel.propTypes = {
  instruments: PropTypes.arrayOf(PropTypes.shape({
    axis: PropTypes.string.isRequired,
    name: PropTypes.string,
    channels: PropTypes.string,
    volume: PropTypes.number,
    calibration: robotConstants.INSTRUMENT_CALIBRATION_TYPE
  })).isRequired,
  labware: PropTypes.arrayOf(PropTypes.shape({
    slot: PropTypes.number.isRequired,
    name: PropTypes.string,
    type: PropTypes.string,
    isTiprack: PropTypes.bool,
    calibration: robotConstants.LABWARE_CONFIRMATION_TYPE
  })).isRequired,
  clearLabwareReviewed: PropTypes.func.isRequired,
  instrumentsCalibrated: PropTypes.bool.isRequired,
  tipracksConfirmed: PropTypes.bool.isRequired,
  labwareConfirmed: PropTypes.bool.isRequired,
  isRunning: PropTypes.bool.isRequired,
  run: PropTypes.func.isRequired
}
