import * as React from 'react'

import styles from './instrument.css'

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
  const values = Array.isArray(value) ? value : [value]
  return (
    <div className={className}>
      <h2 className={styles.title}>{title}</h2>
      {values.map((val, index) => (
        <span key={index} className={styles.value}>
          {val}
        </span>
      ))}
    </div>
  )
}
