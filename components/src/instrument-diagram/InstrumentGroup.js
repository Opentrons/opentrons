// @flow
import * as React from 'react'

import InstrumentInfo, {type InstrumentInfoProps} from './InstrumentInfo'

import styles from './instrument.css'

type Props = {
  left?: InstrumentInfoProps,
  right?: InstrumentInfoProps
}

/**
 * Renders a left and right pipette diagram & info.
 * Takes an array of `InstrumentInfo` props.
 */
export default function InstrumentGroup (props: Props) {
  const {left, right} = props

  return (
    <section className={styles.pipette_group}>
      {left && <InstrumentInfo {...left} />}
      {right && <InstrumentInfo {...right} />}
    </section>
  )
}
