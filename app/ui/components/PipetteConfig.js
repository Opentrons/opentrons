import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import capitalize from 'lodash/capitalize'

import styles from './PipetteConfig.css'
import singlePipetteSrc from '../img/pipette_single.png'

export default function PipetteConfig (props) {
  const {instruments, onPrepareClick} = props

  const pipettes = instruments.map((pipette) => {
    const {name, axis, channels, isCurrent, isProbed, volume} = pipette
    const isUsed = name != null

    const style = classnames(styles.pipette, styles[axis], {
      [styles.disabled]: !isUsed,
      [styles.inactive]: !isCurrent
    })

    const linkStyle = classnames(
      styles.pipette_toggle,
      styles[`toggle_${axis}`]
    )

    const description = isUsed
      ? `${capitalize(channels)}-channel (${volume} ul)`
      : 'N/A'

    const tipType = isUsed
      ? `${volume} ul`
      : 'N/A'

    const infoIcon = isProbed
      ? '✓'
      : '!'

    const infoMessage = isProbed
      ? (<p>Instrument has been calibrated successfully by Tip Probe</p>)
      : (<p>Tip dimensions must be defined using the Tip Probe tool</p>)

    return (
      <div className={style} key={axis}>
        <div className={linkStyle}>
          {pipette.axis}
        </div>
        <div className={styles.pipette_info}>
          <h2 className={styles.title}>
            Pipette
          </h2>
          <h3>
            {description}
          </h3>
          <h2 className={styles.title}>
            Suggested Tip Type
          </h2>
          <h3>
            {tipType}
          </h3>
          <div className={styles.info}>
            <span className={styles.alert}>{infoIcon}</span>
            {infoMessage}
          </div>
          <button
            className={styles.btn_probe}
            onClick={onPrepareClick(axis)}
            disabled={!isCurrent}
          >
            Prepare Pipette Tip
          </button>
        </div>

        <div className={styles.pipette_icon}>
          <img src={singlePipetteSrc} />
        </div>
      </div>
    )
  })

  return (
    <section className={styles.pipette_group}>
      {pipettes}
    </section>
  )
}

PipetteConfig.propTypes = {
  onPrepareClick: PropTypes.func.isRequired,
  currentInstrument: PropTypes.shape({
    axis: PropTypes.string.isRequired
  }),
  instruments: PropTypes.arrayOf(PropTypes.shape({
    axis: PropTypes.string.isRequired,
    channels: PropTypes.string,
    volume: PropTypes.number,
    isProbed: PropTypes.bool
  })).isRequired
}
