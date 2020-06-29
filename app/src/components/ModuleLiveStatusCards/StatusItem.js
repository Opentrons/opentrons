// @flow
import * as React from 'react'

import styles from './styles.css'

type Props = {| status: string |}

export function StatusItem(props: Props): React.Node {
  return (
    <div className={styles.status_item_wrapper}>
      <span className={styles.label}>Status: </span>
      <span className={styles.value}>{props.status}</span>
    </div>
  )
}
