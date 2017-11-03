import React from 'react'
import PropTypes from 'prop-types'

import {constants as robotConstants} from '../robot'
import styles from './TipProbe.css'
import {Spinner, Warning} from './icons'

const {
  UNPROBED,
  PREPARING_TO_PROBE,
  READY_TO_PROBE,
  PROBING,
  PROBED
} = robotConstants

TipProbe.propTypes = {
  instrument: PropTypes.shape({
    name: PropTypes.string,
    volume: PropTypes.number,
    probed: PropTypes.bool,
    calibration: PropTypes.oneOf([
      UNPROBED,
      PREPARING_TO_PROBE,
      READY_TO_PROBE,
      PROBING,
      PROBED
    ])
  }).isRequired,
  onPrepareClick: PropTypes.func.isRequired,
  onProbeTipClick: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func.isRequired
}

export default function TipProbe (props) {
  return (
    <InfoBox {...props}>
      <TipProbeMessage {...props} />
      <TipProbeButtonOrSpinner {...props} />
      <TipProbeWarning {...props} />
    </InfoBox>
  )
}

function InfoBox (props) {
  const {instrument: {calibration}, onCancelClick} = props
  let cancelButton = null

  if (calibration === READY_TO_PROBE || calibration === PROBED) {
    cancelButton = (
      <span role='button' onClick={onCancelClick} className={styles.close}>
        X
      </span>
    )
  }

  return (
    <div className={styles.info}>
      {cancelButton}
      {props.children}
    </div>
  )
}

function TipProbeMessage (props) {
  const {instrument: {probed, calibration, volume}} = props
  let icon = null
  let message = ''

  if (calibration === UNPROBED || calibration === PREPARING_TO_PROBE) {
    if (!probed) {
      icon = (
        <Warning className={styles.alert} />
      )
      message = (
        'For accuracy, you must define tip dimensions using the Tip Probe tool'
      )
    }
  } else if (calibration === READY_TO_PROBE) {
    message = (
      <span>
        Place a previously used or otherwise discarded
        <strong>{` ${volume} uL `}</strong>
        tip on the pipette and click CONTINUE.
      </span>
    )
  } else if (calibration === PROBING) {
    message = (
      <span className={styles.important}>
        Tip Probe is finding tip...
      </span>
    )
  } else if (calibration === PROBED) {
    message = (
      <span>
        <p className={styles.submessage}>
          Tip dimensions are now defined.
        </p>
        <p className={styles.submessage}>
          <strong>Remove tip by hand and discard.</strong>
        </p>
        <p className={styles.submessage}>
          <strong>
            Replace trash bin on top of Tip Probe tool once all tips have been defined.
          </strong>
        </p>
      </span>
    )
  }

  return (
    <p>{icon}{message}</p>
  )
}

function TipProbeButtonOrSpinner (props) {
  const {instrument: {calibration}, onPrepareClick, onProbeTipClick} = props

  switch (calibration) {
    case UNPROBED: return (
      <button className={styles.btn_probe} onClick={onPrepareClick}>
        Start Tip Probe
      </button>
    )

    case READY_TO_PROBE: return (
      <button className={styles.btn_probe} onClick={onProbeTipClick}>
        Continue
      </button>
    )

    case PREPARING_TO_PROBE:
    case PROBING:
      return (<Spinner className={styles.progress} />)
  }

  return null
}

function TipProbeWarning (props) {
  const {instrument: {calibration}} = props

  if (calibration === UNPROBED) {
    return (
      <p className={styles.warning}>
        ATTENTION:  REMOVE ALL LABWARE AND TRASH BIN FROM DECK BEFORE STARTING TIP PROBE.
      </p>
    )
  }

  return null
}
