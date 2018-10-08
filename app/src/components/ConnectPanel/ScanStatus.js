// @flow
import * as React from 'react'

import ScanButton from './ScanButton'

import styles from './connect-panel.css'

type Props = {
  onScanClick: () => mixed,
  isScanning: boolean,
  found: boolean,
}

export default function ScanStatus (props: Props) {
  const {found, isScanning} = props

  const notFoundMessage = !isScanning && !found && (
    <div>
      <h3 className={styles.title}>No robots found!</h3>
      <p className={styles.message}>If you haven’t set up wifi on your robot<br />please connect it with USB</p>
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
