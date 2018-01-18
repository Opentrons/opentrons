// @flow
import React from 'react'
import classnames from 'classnames'

import InfoItem from './InfoItem.js' // move to comp lib?
import InstrumentDiagram from './InstrumentDiagram.js'

import styles from './instrument.css'

export type InstrumentInfoProps = {
  axis: string,
  description: string,
  tipType: string,
  isDisabled: boolean,
  channels?: number,
  className?: string
}

export default function InstrumentInfo (props: InstrumentInfoProps) {
  const className = classnames(styles.pipette, styles[props.axis], {
    [styles.disabled]: props.isDisabled
  })

  return (
    <div className={className}>
      <div className={styles.pipette_info}>
        <InfoItem title={'pipette'} value={props.description} />
        <InfoItem title={'suggested tip type'} value={props.tipType} />
      </div>
      <InstrumentDiagram channels={props.channels} />
    </div>
  )
}
