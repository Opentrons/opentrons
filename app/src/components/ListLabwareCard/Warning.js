// @flow
import * as React from 'react'

import { Icon } from '@opentrons/components'
import styles from './styles.css'

export type WarningProps = {|
  children: React.Node,
|}

export function Warning(props: WarningProps): React.Node {
  const { children } = props

  return (
    <div className={styles.warning}>
      <Icon className={styles.warning_icon} name="alert-circle" />
      <div>{children}</div>
    </div>
  )
}
