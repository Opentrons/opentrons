// @flow
import * as React from 'react'

import { InstrumentInfo } from './InstrumentInfo'
import styles from './instrument.css'

import type { InstrumentInfoProps } from './InstrumentInfo'

export type InstrumentGroupProps = $Shape<{|
  showMountLabel: ?boolean,
  left: ?InstrumentInfoProps,
  right: ?InstrumentInfoProps,
|}>

const EMPTY_INSTRUMENT_PROPS = {
  description: 'None',
  tiprackModel: 'N/A',
  isDisabled: false,
}

/**
 * Renders a left and right pipette diagram & info.
 * Takes child `InstrumentInfo` props in `right` and `left` props.
 */
export function InstrumentGroup(props: InstrumentGroupProps) {
  const { left, right, showMountLabel } = props

  const leftProps = left || { ...EMPTY_INSTRUMENT_PROPS, mount: 'left' }
  const rightProps = right || { ...EMPTY_INSTRUMENT_PROPS, mount: 'right' }
  return (
    <section className={styles.pipette_group}>
      <InstrumentInfo {...leftProps} showMountLabel={showMountLabel} />
      <InstrumentInfo {...rightProps} showMountLabel={showMountLabel} />
    </section>
  )
}
