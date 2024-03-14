import * as React from 'react'

import styles from './instrument.module.css'

export interface InfoItemProps {
  title: string
  value: string
  className?: string
}

/**
 * Used by `InstrumentInfo` for its titled values.
 * But if you're using this, you probably want `LabeledValue` instead.
 */
export function InfoItem(props: InfoItemProps): JSX.Element {
  const { title, value, className } = props

  return (
    <div className={className}>
      <h2 className={styles.title}>{title}</h2>
      <span className={styles.value}>{value}</span>
    </div>
  )
}
