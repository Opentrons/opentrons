import React from 'react'
import {Link} from 'react-router-dom'
import classnames from 'classnames'
import styles from './SetupPanel.css'

function PipetteLinks (props) {
  const {axis, volume, channels, isProbed} = props
  const url = `/setup-instruments/${axis}`
  const style = isProbed
    ? styles.confirmed
    : styles.alert
  return (
    <li key={axis}>
      <Link to={url} className={style}>
        <span className={styles.axis}>{axis}</span>
        <span className={styles.type}>{channels}-Channel ({volume}ul)</span>
      </Link>
    </li>
  )
}

function LabwareLinks (props) {
  const {name, slot, isConfirmed, isTiprack, tipracksConfirmed} = props
  const url = `/setup-deck/${slot}`
  const calibrationStyle = isConfirmed
    ? styles.confirmed
    : styles.alert
  let isDisabled = !isTiprack && !tipracksConfirmed
  return (
    <li key={slot}>
      <Link to={url} className={classnames({[styles.disabled] : isDisabled}, calibrationStyle)}>
        [{slot}] {name}
      </Link>
    </li>
  )
}

export default function SetupPanel (props) {
  const {
    instruments,
    labware,
    instrumentsConfirmed,
    labwareConfirmed,
    tipracksConfirmed
  } = props
  const instrumentList = instruments.map((inst) => PipetteLinks({
    ...inst
  }))
  let tiprackList = []
  let labwareList = []
  labware.map((lab) => {
    if (lab.isTiprack ) {
      tiprackList.push(LabwareLinks({...lab}))
    } else {
      labwareList.push(LabwareLinks(
        {...lab, tipracksConfirmed}
      ))
    }
  })
  const pipetteSetup =
    <section className={styles.pipette_group}>
      <Link to='/setup-instruments'>Pipette Setup</Link>
      <ul>
        {instrumentList}
      </ul>
    </section>

  let labwareSetup
  if (instrumentsConfirmed) {
    labwareSetup =
      <section className={styles.labware_group}>
        <Link to='/setup-deck'>Labware Setup</Link>
        <ul>
          {tiprackList}
          {labwareList}
        </ul>
      </section>
  }

  let runLink
  if (labwareConfirmed) {
    runLink = <Link to='/run' className={styles.run_link}>Run Protocol</Link>
  }

  return (
    <div className={styles.setup_panel}>
      <h1>Prepare Robot for RUN</h1>
      <section className={styles.links}>
        {pipetteSetup}
        {labwareSetup}
      </section>
      {runLink}
    </div>
  )
}
