// @flow
import * as React from 'react'

import ScanButton from './ScanButton'

import styles from './connect-panel.css'

type Props = {
  onScanClick: () => void,
  isScanning: boolean,
  found: boolean
}

export default function ScanStatus (props: Props) {
  const {found, isScanning} = props

  const notFoundMessage = !isScanning && !found && (
    <div>
      <p><strong>No robots found</strong></p>
      <p>Connect a robot via USB and click the scan button</p>
    </div>
  )

  return (
    <div className={styles.scan_status}>
      {notFoundMessage}
      <ScanButton {...props} />
    </div>
  )
}
