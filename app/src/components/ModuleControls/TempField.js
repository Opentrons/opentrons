// @flow
import * as React from 'react'
import styles from './styles.css'

type Props = {
  field: any,
  inputRef: { current: null | HTMLInputElement },
}

export default function TempField(props: Props) {
  const { field, inputRef } = props
  return (
    <div className={styles.target_field}>
      <label className={styles.target_label}>Set Target Temp:</label>
      <input
        {...field}
        type="text"
        className={styles.target_input}
        ref={inputRef}
      />
    </div>
  )
}
