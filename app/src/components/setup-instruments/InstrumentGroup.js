// @flow
import * as React from 'react'

import InstrumentInfo, {type InstrumentInfoProps} from './InstrumentInfo'

import styles from './instrument.css'

type Props = {
  instruments: InstrumentInfoProps[]
}

export default function InstrumentGroup (props: Props) {
  const {instruments} = props
  return (
    <section className={styles.pipette_group}>
      {instruments.map((instrument) => {
        console.log(instrument)
        return (
          <InstrumentInfo {...instrument} key={instrument.axis} />
        )
      })}
    </section>
  )
}
