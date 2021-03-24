// in progress spinner for ConfirmModalContents
import * as React from 'react'

import { Icon } from '@opentrons/components'
import styles from './styles.css'

export function InProgressContents(): React.ReactNode {
  return <Icon className={styles.spinner} name="ot-spinner" spin />
}
