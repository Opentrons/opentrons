import React from 'react'
import PropTypes from 'prop-types'
import styles from './TipProbe.css'
import progressGifSrc from '../img/loading.gif'

function PrepareForProbe (props) {
  const {volume, isCurrent, onProbeTipClick} = props
  return (
    <span className={styles.info}>
      <p>Complete the following steps prior to clicking [Initiate Tip Probe]</p>
      <ol>
        <li>Remove all labware from deck.</li>
        <li>Remove trash bin to reveal Tip Probe tool.</li>
        <li>Place a previously used or otherwise discarded <strong>{volume} ul</strong> tip on the pipette.</li>
      </ol>
      <button
        className={styles.btn_probe}
        onClick={onProbeTipClick}
        disabled={!isCurrent}
      >
        Continue
      </button>
    </span>
  )
}

PrepareForProbe.propTypes = {
  volume: PropTypes.number.isRequired
}

function RobotIsMoving (props) {
  return (
    <span className={styles.info}>
      <h3 className={styles.title}>Robot is Moving</h3>
      <img src={progressGifSrc} className={styles.progress} />
    </span>
  )
}

function ProbeSuccess (props) {
  const {volume} = props
  return (
    <span className={styles.info}>
      <p>Tip dimensions for <strong>{volume} ul</strong> tips are now defined.</p>
      <ol>
        <li>Remove tip by hand and discard.</li>
        <li>Replace trash bin on top of Tip Probe tool once all tips have been defined.</li>
      </ol>
    </span>
  )
}

function DefaultMessage (props) {
  const {onPrepareClick, isProbed, isCurrent} = props
  const infoIcon = isProbed
    ? '✓'
    : '!'
  const infoMessage = isProbed
    ? (<p>Instrument has been calibrated successfully by Tip Probe</p>)
    : (<p>Tip dimensions must be defined using the Tip Probe tool</p>)
  return (
    <span>
      <span className={styles.info}>
        <span className={styles.alert}>{infoIcon}</span>
        {infoMessage}
        <button className={styles.btn_probe} onClick={onPrepareClick} disabled={!isCurrent}>Start Tip Probe</button>
      </span>
      <p className={styles.warning}>ATTENTION:  REMOVE ALL LABWARE AND TRASH BIN FROM DECK BEFORE STARTING TIP PROBE.</p>
    </span>
  )
}

ProbeSuccess.propTypes = {
  volume: PropTypes.number.isRequired
}

export default function TipProbe (props) {
  const {onPrepareClick, onProbeTipClick, instrument, currentCalibration} = props
  const {isCurrent} = instrument || {}
  const {isPreparingForProbe, isReadyForProbe, isProbing} = currentCalibration

  let probeMessage = null
  if (isReadyForProbe && isCurrent) {
    probeMessage = <PrepareForProbe {...instrument} onProbeTipClick={onProbeTipClick} />
  } else if ((isPreparingForProbe || isProbing) && isCurrent) {
    probeMessage = <RobotIsMoving />
  } else {
    probeMessage = <DefaultMessage {...instrument} onPrepareClick={onPrepareClick} />
  }

  return probeMessage
}

TipProbe.propTypes = {
  onProbeTipClick: PropTypes.func.isRequired,
  instrument: PropTypes.shape({
    volume: PropTypes.number
  }),
  currentCalibration: PropTypes.shape({
    isPreparingForProbe: PropTypes.bool,
    isReadyForProbe: PropTypes.bool,
    isProbing: PropTypes.bool
  }).isRequired
}
