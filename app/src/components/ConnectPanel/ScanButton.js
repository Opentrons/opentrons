// @flow
import * as React from 'react'
import {Icon, PrimaryButton} from '@opentrons/components'

import styles from './connect-panel.css'

type Props = {
  isScanning: boolean,
  onScanClick: () => mixed,
  found: boolean,
}

export default function ScanButton (props: Props) {
  const {isScanning, onScanClick, found} = props
  const buttonText = found
    ? 'Refresh List'
    : 'Try Again'

  if (isScanning) {
    return (
      <Icon name='ot-spinner' className={styles.scan_progress} spin />
    )
  }

  return (
    <PrimaryButton
      onClick={onScanClick}
      className={styles.scan_button}
    >
      {buttonText}
    </PrimaryButton>
  )
}
