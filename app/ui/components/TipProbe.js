import React from 'react'
import PropTypes from 'prop-types'
import styles from './TipProbe.css'

function PrepareForProbe (props) {
  const {volume} = props
  return (
    <section className={styles.probe_msg} >
      <h3>Complete the following steps prior to clicking [Initiate Tip Probe]</h3>
      <ol>
        <li>Remove all labware from deck.</li>
        <li>Remove trash bin to reveal Tip Probe tool.</li>
        <li>Place a previously used or otherwise discarded <strong>{volume} ul</strong> tip on the pipette.</li>
      </ol>
      <button className={styles.btn_probe} onClick={console.log('onInitiateTipProbeClick')}>Initiate Tip Probe</button>
    </section>
  )
}

PrepareForProbe.propTypes = {
  volume: PropTypes.number.isRequired
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
      <button className={styles.btn_probe} onClick={console.log('close, next pipette route?')}>Close</button>
    </section>
  )
}

ProbeSuccess.propTypes = {
  volume: PropTypes.number.isRequired
}

export default function TipProbe (props) {
  const {currentInstrument} = props
  const {
    tipIsPreparingForProbe,
    tipIsProbing,
    tipIsProbed
  } = currentInstrument

  let probeMessage = null
  if (tipIsPreparingForProbe) {
    probeMessage = <PrepareForProbe {...currentInstrument} />
  } else if (tipIsProbing) {
    probeMessage = <ProbeInitiated />
  } else if (tipIsProbed) {
    probeMessage = <ProbeSuccess {...currentInstrument} />
  } else {
    probeMessage = null
  }
  return probeMessage
}

TipProbe.propTypes = {
  currentInstrument: PropTypes.shape({
    volume: PropTypes.number.isRequired,
    tipIsPreparingForProbe: PropTypes.bool.isRequired,
    tipIsProbing: PropTypes.bool.isRequired,
    tipIsProbed: PropTypes.bool.isRequired
  }).isRequired
}
