import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import capitalize from 'lodash/capitalize'

import ConnectedTipProbe from '../containers/ConnectedTipProbe'
import styles from './PipetteConfig.css'
import singlePipetteSrc from '../img/pipette_single.png'

export default function PipetteConfig (props) {
  const {instruments, onPrepareClick} = props

  const pipettes = instruments.map((instrument) => {
    const {name, axis, channels, isCurrent, isProbed, volume} = instrument
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

    return (
      <div className={style} key={axis}>
        <div className={linkStyle}>
          {axis}
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
            <ConnectedTipProbe instrument={instrument}/>
          </div>
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
