import React from 'react'
import {NavLink} from 'react-router-dom'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import capitalize from 'lodash/capitalize'

import styles from './SetupPanel.css'

function PipetteLinks (props) {
  const {axis, name, volume, channels, isProbed, onClick} = props
  const isDisabled = name == null

  const style = isProbed || isDisabled
    ? styles.confirmed
    : styles.alert

  const description = !isDisabled
    ? `${capitalize(channels)}-channel (${volume} ul)`
    : 'N/A'

  return (
    <li key={axis}>
      <button className={style} onClick={onClick}>
        <span className={styles.axis}>{axis}</span>
        <span className={styles.type}>{description}</span>
      </button>
    </li>
  )
}

function LabwareLinks (props) {
  const {name, slot, isConfirmed, isTiprack, isTipracksConfirmed, onClick} = props
  const isDisabled = !isTiprack && !isTipracksConfirmed
  const buttonStyle = classnames(styles.btn_labware, {
    [styles.confirmed]: isConfirmed,
    [styles.alert]: !isConfirmed,
    [styles.disabled]: isDisabled
  })

  return (
    <li key={slot}>
      <button className={buttonStyle} onClick={onClick} disabled={isDisabled}>
        [{slot}] {name}
      </button>
    </li>
  )
}

export default function SetupPanel (props) {
  const {
    instruments,
    labware,
    instrumentsAreCalibrated,
    isLabwareConfirmed,
    isTipracksConfirmed,
    setInstrument,
    setLabware
  } = props

  const instrumentList = instruments.map((i) => (
    <PipetteLinks {...i} onClick={setInstrument(i.axis)} />
  ))

  const {tiprackList, labwareList} = labware.reduce((result, lab) => {
    const onClick = setLabware(lab.slot)
    const links = LabwareLinks({...lab, isTipracksConfirmed, onClick})

    if (lab.name && lab.isTiprack) {
      result.tiprackList.push(links)
    } else if (lab.name) {
      result.labwareList.push(links)
    }

    return result
  }, {tiprackList: [], labwareList: []})

  const runLink = isLabwareConfirmed
    ? (<NavLink to='/run' className={styles.run_link}>Run Protocol</NavLink>)
    : null

  return (
    <div className={styles.setup_panel}>
      <h1>Prepare Robot for RUN</h1>
      <section className={styles.links}>
        <section className={styles.pipette_group}>
          <NavLink to='/setup-instruments'>Pipette Setup</NavLink>
          <ul className={styles.step_list}>
            {instrumentList}
          </ul>
        </section>
        <section className={classnames(styles.labware_group, {
          [styles.unavailable]: !instrumentsAreCalibrated})
        }>
          <NavLink to='/setup-deck'>Labware Setup</NavLink>
          <ul className={styles.step_list}>
            {tiprackList}
            {labwareList}
          </ul>
        </section>
      </section>
      {runLink}
    </div>
  )
}

SetupPanel.propTypes = {
  setInstrument: PropTypes.func.isRequired,
  setLabware: PropTypes.func.isRequired,
  instruments: PropTypes.arrayOf(PropTypes.shape({
    axis: PropTypes.string.isRequired,
    name: PropTypes.string,
    channels: PropTypes.string,
    volume: PropTypes.number,
    isProbed: PropTypes.bool
  })).isRequired,
  labware: PropTypes.arrayOf(PropTypes.shape({
    slot: PropTypes.number.isRequired,
    name: PropTypes.string,
    type: PropTypes.string,
    isConfirmed: PropTypes.bool,
    isTiprack: PropTypes.bool
  })).isRequired,
  instrumentsAreCalibrated: PropTypes.bool.isRequired,
  isTipracksConfirmed: PropTypes.bool.isRequired,
  isLabwareConfirmed: PropTypes.bool.isRequired
}
