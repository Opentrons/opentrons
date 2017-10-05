import React from 'react'
import {NavLink} from 'react-router-dom'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from './SetupPanel.css'

function PipetteLinks (props) {
  const {axis, volume, channels, isProbed} = props
  const style = isProbed
    ? styles.confirmed
    : styles.alert
  return (
    <li key={axis}>
      <button className={style}>
        <span className={styles.axis}>{axis}</span>
        <span className={styles.type}>{channels}-Channel ({volume}ul)</span>
      </button>
    </li>
  )
}

function LabwareLinks (props) {
  const {name, slot, isConfirmed, isTiprack, isTipracksConfirmed} = props
  const calibrationStyle = isConfirmed
    ? styles.confirmed
    : styles.alert
  let isDisabled = !isTiprack && !isTipracksConfirmed
  return (
    <li key={slot}>
      <button className={classnames({[styles.disabled]: isDisabled}, calibrationStyle, styles.btn_labware)}>
        [{slot}] {name}
      </button>
    </li>
  )
}

export default function SetupPanel (props) {
  const {
    instruments,
    labware,
    isInstrumentsConfirmed,
    isLabwareConfirmed,
    isTipracksConfirmed
  } = props
  const instrumentList = instruments.map((inst) => PipetteLinks({
    ...inst
  }))

  const {tiprackList, labwareList} = labware.reduce((result, lab) => {
    const links = LabwareLinks({...lab, isTipracksConfirmed})
    if (lab.isTiprack) {
      result.tiprackList.push(links)
    } else {
      result.labwareList.push(links)
    }
    return result
  }, {tiprackList: [], labwareList: []})

  let runLink
  if (isLabwareConfirmed) {
    runLink = <NavLink to='/run' className={styles.run_link}>Run Protocol</NavLink>
  }

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
        <section className={classnames({[styles.unavailable]: !isInstrumentsConfirmed}, styles.labware_group)}>
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
  instruments: PropTypes.arrayOf(PropTypes.shape({
    axis: PropTypes.string.isRequired,
    channels: PropTypes.string.isRequired,
    volume: PropTypes.number.isRequired,
    isProbed: PropTypes.bool.isRequired
  })).isRequired,
  labware: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    slot: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    isConfirmed: PropTypes.bool.isRequired,
    isTiprack: PropTypes.bool.isRequired
  })).isRequired,
  isInstrumentsConfirmed: PropTypes.bool.isRequired,
  isTipracksConfirmed: PropTypes.bool.isRequired,
  isLabwareConfirmed: PropTypes.bool.isRequired
}
