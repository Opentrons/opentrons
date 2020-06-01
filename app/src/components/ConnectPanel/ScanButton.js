// @flow
import * as React from 'react'
import { Icon, PrimaryButton } from '@opentrons/components'

import styles from './styles.css'

export type ScanButtonProps = {|
  isScanning: boolean,
  onScanClick: () => mixed,
  found: boolean,
|}

export function ScanButton(props: ScanButtonProps): React.Node {
  const { isScanning, onScanClick, found } = props
  const buttonText = found ? 'Refresh List' : 'Try Again'

  if (isScanning) {
    return <Icon name="ot-spinner" className={styles.scan_progress} spin />
  }

  return (
    <PrimaryButton onClick={onScanClick} className={styles.scan_button}>
      {buttonText}
    </PrimaryButton>
  )
}
