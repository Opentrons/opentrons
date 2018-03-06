// @flow
import * as React from 'react'
import {Icon, PrimaryButton, SPINNER} from '@opentrons/components'

import styles from './connect-panel.css'

type Props = {
  isScanning: boolean,
  onScanClick: () => mixed,
  inTitleBar?: boolean,
  found: boolean
}

export default function ScanButton (props: Props) {
  const {isScanning, onScanClick, found} = props
  const buttonText = found
    ? 'Refresh List'
    : 'Try Again'
  if (isScanning) {
    return (
      <Icon name={SPINNER} spin={isScanning} className={styles.scan_progress} />
    )
  } else {
    return (
      <PrimaryButton
        onClick={onScanClick}
        className={styles.scan_button}
      >
        {buttonText}
      </PrimaryButton>
    )
  }
}
