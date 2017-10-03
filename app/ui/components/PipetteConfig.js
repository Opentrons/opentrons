import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom'
import styles from './PipetteConfig.css'

export default function PipetteConfig (props) {
  const {side, instruments} = props

  const pipettes = instruments.map((pipette) => {
    const isActive = side === pipette.axis
    const route = `/setup-instruments/${pipette.axis}`
    return (
      <div
        className={classnames(styles[pipette.axis], {[styles.active]: isActive})}
        key={pipette.axis}
      >
        <Link to={route}
          className={classnames(
            styles.pipette_toggle,
            styles[`toggle_${pipette.axis}`]
          )}
        >
          {pipette.axis}
        </Link>
        <div className={styles.pipette_info}>
          <h2 className={styles.title}>Pipette</h2>
          <h3>{pipette.channels}-Channel ({pipette.volume}ul) </h3>
          <h2 className={styles.title}>Suggested Tip Type</h2>
          <h3>{pipette.volume}ul</h3>
          <div className={styles.info}>
            <span className={styles.alert}>!</span>
            <p>For accuracy, tip dimensions must be defined using the Tip Probe tool.</p>
          </div>
          <button className={styles.btn_probe}>Prepare Pipette Tip</button>
        </div>

        <div className={styles.pipette_icon}>
          img
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
  instruments: PropTypes.arrayOf(PropTypes.shape({
    axis: PropTypes.string.isRequired,
    channels: PropTypes.number.isRequired,
    volume: PropTypes.number.isRequired,
    isProbed: PropTypes.bool.isRequired
  })).isRequired
}
