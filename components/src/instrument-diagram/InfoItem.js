// @flow
import React from 'react'
import startCase from 'lodash/startCase'

import styles from './instrument.css'

type Props = {
  title: string,
  value: string,
  className?: string,
}

/**
 * Used by `InstrumentInfo` for its titled values.
 * But if you're using this, you probably want `LabeledValue` instead.
 */
export default function InfoItem (props: Props) {
  const {title, value, className} = props
  return (
    <div className={className}>
      <h2 className={styles.title}>{startCase(title)}</h2>
      <span className={styles.value}>{value}</span>
    </div>
  )
}
