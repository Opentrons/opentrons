import React from 'react'
import {Link} from 'react-router-dom'
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
  const {name, slot, type, isConfirmed} = props
  const url = `/setup-deck/${slot}`
  const style = isConfirmed
    ? styles.confirmed
    : styles.alert
  return (
    <li key={slot}>
      <Link to={url} className={style}>
        [{slot}] {name}
      </Link>
    </li>
  )
}

export default function SetupPanel (props) {
  const {instruments, labware, instrumentsConfirmed} = props
  const instrumentList = instruments.map((i) => PipetteLinks({
    ...i
  }))
  const labwareList = labware.map((l) => LabwareLinks({
    ...l
  }))
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
        {labwareList}
      </ul>
    </section>
  }

  return (
    <div className={styles.nav_panel}>
      <h1>Prepare Robot for RUN</h1>
      <section className={styles.links}>
        {pipetteSetup}
        {labwareSetup}
        <Link to='/run'>Run</Link>
      </section>
    </div>
  )
}
