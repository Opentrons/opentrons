// @flow
import * as React from 'react'

import { ScanButton } from './ScanButton'
import styles from './styles.css'

export type ScanStatusProps = {|
  onScanClick: () => mixed,
  isScanning: boolean,
  found: boolean,
|}

export function ScanStatus(props: ScanStatusProps): React.Node {
  const { found, isScanning } = props

  const notFoundMessage = !isScanning && !found && (
    <div>
      <h3 className={styles.title}>No robots found!</h3>
      <p className={styles.message}>
        If you haven&apos;t set up Wi-Fi on your robot please connect it with
        USB
      </p>
    </div>
  )

  const initialScanMessage = isScanning && !found && (
    <h3 className={styles.title}>Looking for robots...</h3>
  )

  return (
    <div className={styles.scan_status}>
      {initialScanMessage}
      {notFoundMessage}
      <ScanButton {...props} />
    </div>
  )
}
