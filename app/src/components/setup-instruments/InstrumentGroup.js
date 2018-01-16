import React from 'react'
import InstrumentInfo from './InstrumentInfo'
import styles from './instrument.css'

export default function InstrumentGroup (props) {
  const {instruments, currentInstrument} = props
  return(
    <section className={styles.pipette_group}>
      {instruments.map((inst) => {
        return(
          <InstrumentInfo {...inst} currentInstrument={currentInstrument} key={inst.axis}/>
        )
      })}
    </section>
  )
}
