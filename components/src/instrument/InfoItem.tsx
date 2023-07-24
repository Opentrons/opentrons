import * as React from 'react'

import styles from './instrument.css'
export interface InfoItemProps {
  title: string | null
  value: string
}

/**
 * Used by `InstrumentInfo` for its titled values.
 * But if you're using this, you probably want `LabeledValue` instead.
 */
export function InfoItem(props: InfoItemProps): JSX.Element {
  const { title, value } = props

  return (
    <div>
      {title != null ? <h2 className={styles.title}>{title}</h2> : null}
      <span className={styles.value}>{value}</span>
    </div>
  )
}
