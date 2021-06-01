import * as React from 'react'
import { CardContentFull } from '../../../../atoms/layout'
import styles from './styles.css'

export function NoModulesMessage(): JSX.Element {
  return (
    <CardContentFull>
      <p className={styles.modules_description}>No modules detected.</p>

      <p className={styles.modules_description}>
        Connect a module to your robot via USB, then power it on.
      </p>
    </CardContentFull>
  )
}
