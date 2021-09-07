import * as React from 'react'

import { Icon } from '@opentrons/components'
import styles from './styles.css'

export interface WarningProps {
  children: React.ReactNode
}

export function Warning(props: WarningProps): JSX.Element {
  const { children } = props

  return (
    <div className={styles.warning}>
      <Icon className={styles.warning_icon} name="alert-circle" />
      <div>{children}</div>
    </div>
  )
}
