import React from 'react'
import PropTypes from 'prop-types'

import InstrumentInfo from './InstrumentInfo'

import styles from './instrument.css'

InstrumentGroup.propTypes = {
  currentInstrument: PropTypes.shape({
    axis: PropTypes.string.isRequired
  }),
  instruments: PropTypes.arrayOf(PropTypes.shape({
    axis: PropTypes.string.isRequired,
    channels: PropTypes.number,
    volume: PropTypes.number
  })).isRequired
}

export default function InstrumentGroup (props) {
  const {instruments, currentInstrument} = props
  return (
    <section className={styles.pipette_group}>
      {instruments.map((inst) => {
        return (
          <InstrumentInfo {...inst} currentInstrument={currentInstrument} key={inst.axis} />
        )
      })}
    </section>
  )
}
