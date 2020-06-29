// @flow
// in progress spinner for ConfirmModalContents
import { Icon } from '@opentrons/components'
import * as React from 'react'

import styles from './styles.css'

export function InProgressContents(): React.Node {
  return <Icon className={styles.spinner} name="ot-spinner" spin />
}
