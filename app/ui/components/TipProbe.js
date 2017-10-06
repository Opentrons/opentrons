import React from 'react'
import PropTypes from 'prop-types'
import styles from './TipProbe.css'

function PrepareForProbe (props) {
  const {volume, onProbeTipClick} = props
  return (
    <section className={styles.probe_msg} >
      <h3>Complete the following steps prior to clicking [Initiate Tip Probe]</h3>
      <ol>
        <li>Remove all labware from deck.</li>
        <li>Remove trash bin to reveal Tip Probe tool.</li>
        <li>Place a previously used or otherwise discarded <strong>{volume} ul</strong> tip on the pipette.</li>
      </ol>
      <button className={styles.btn_probe} onClick={onProbeTipClick}>Initiate Tip Probe</button>
    </section>
  )
}

PrepareForProbe.propTypes = {
  volume: PropTypes.number.isRequired
}

function RobotIsMoving (props) {
  return (
    <section className={styles.probe_msg} >
      <h3>Robot is moving..</h3>
    </section>
  )
}

function ProbeInitiated (props) {
  return (
    <section className={styles.probe_msg} >
      <h3>Tip Probe Finding Tip...</h3>
    </section>
  )
}

function ProbeSuccess (props) {
  const {volume} = props
  return (
    <section className={styles.probe_msg} >
      <h3>Tip dimensions for <strong>{volume} ul</strong> tips are now defined.</h3>
      <ol>
        <li>Remove tip by hand and discard.</li>
        <li>Replace trash bin on top of Tip Probe tool once all tips have been defined.</li>
      </ol>
    </section>
  )
}

ProbeSuccess.propTypes = {
  volume: PropTypes.number.isRequired
}

export default function TipProbe (props) {
  const {onProbeTipClick, currentInstrument, currentCalibration} = props
  const {isProbed, axis} = currentInstrument || {}
  const {isPreparingForProbe, isReadyForProbe, isProbing} = currentCalibration

  let probeMessage = null
  if (isReadyForProbe) {
    probeMessage = <PrepareForProbe {...currentInstrument} onProbeTipClick={onProbeTipClick(axis)} />
  } else if (isPreparingForProbe) {
    probeMessage = <RobotIsMoving />
  } else if (isProbing) {
    probeMessage = <ProbeInitiated />
  } else if (isProbed) {
    probeMessage = <ProbeSuccess {...currentInstrument} />
  } else {
    probeMessage = null
  }

  return probeMessage
}

TipProbe.propTypes = {
  onProbeTipClick: PropTypes.func.isRequired,
  currentInstrument: PropTypes.shape({
    volume: PropTypes.number.isRequired
  }),
  currentCalibration: PropTypes.shape({
    isPreparingForProbe: PropTypes.bool,
    isReadyForProbe: PropTypes.bool,
    isProbing: PropTypes.bool
  }).isRequired
}
