import React from 'react'
import PropTypes from 'prop-types'

import {constants as robotConstants} from '../robot'
import styles from './TipProbe.css'
import {Spinner} from './icons'

function PrepareForProbe (props) {
  const {volume, onProbeTipClick} = props
  return (
    <span className={styles.info}>
      <p>Complete the following steps prior to clicking [CONTINUE]</p>
      <ol>
        <li>Remove all labware from deck.</li>
        <li>Remove trash bin to reveal Tip Probe tool.</li>
        <li>Place a previously used or otherwise discarded <strong>{volume} ul</strong> tip on the pipette.</li>
      </ol>
      <button className={styles.btn_probe} onClick={onProbeTipClick}>
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
      <Spinner className={styles.progress} />
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
  const {onPrepareClick, calibration, name} = props
  const isProbed = calibration === robotConstants.PROBED

  const infoIcon = isProbed || name == null
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
        <button className={styles.btn_probe} onClick={onPrepareClick}>
          Start Tip Probe
        </button>
      </span>
      <p className={styles.warning}>ATTENTION:  REMOVE ALL LABWARE AND TRASH BIN FROM DECK BEFORE STARTING TIP PROBE.</p>
    </span>
  )
}

ProbeSuccess.propTypes = {
  volume: PropTypes.number.isRequired
}

export default function TipProbe (props) {
  const {onPrepareClick, onProbeTipClick, instrument} = props
  const status = instrument.calibration

  let probeMessage = null
  if (status === robotConstants.READY_TO_PROBE) {
    probeMessage = (
      <PrepareForProbe {...instrument} onProbeTipClick={onProbeTipClick} />
    )
  } else if (
    status === robotConstants.PREPARING_TO_PROBE ||
    status === robotConstants.PROBING
  ) {
    probeMessage = (
      <RobotIsMoving />
    )
  } else {
    probeMessage = (
      <DefaultMessage {...instrument} onPrepareClick={onPrepareClick} />
    )
  }

  return probeMessage
}

TipProbe.propTypes = {
  onProbeTipClick: PropTypes.func.isRequired,
  instrument: PropTypes.shape({
    volume: PropTypes.number,
    calibration: PropTypes.oneOf([
      robotConstants.UNPROBED,
      robotConstants.PREPARING_TO_PROBE,
      robotConstants.READY_TO_PROBE,
      robotConstants.PROBING,
      robotConstants.PROBED
    ])
  })
}
