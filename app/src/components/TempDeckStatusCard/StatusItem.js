// @flow
import * as React from 'react'
import styles from './styles.css'

type Props = {status: string}

export default function StatusItem (props: Props) {
  return (
    <div>
      <span className={styles.label}>Status: </span>
      <span className={styles.value}>{props.status}</span>
    </div>
  )
}
