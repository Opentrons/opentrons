import React from 'react'
import PropTypes from 'prop-types'

import {Spinner} from '../icons'
import ScanButton from './ScanButton'

import styles from './connect-panel.css'

ScanStatus.propTypes = {
  onScanClick: PropTypes.func.isRequired,
  isScanning: PropTypes.bool.isRequired,
  found: PropTypes.bool.isRequired
}

export default function ScanStatus (props) {
  const {found, isScanning} = props

  const notFoundMessage = !isScanning && !found && (
    <div>
      <p><strong>No robots found</strong></p>
      <p>Connect a robot via USB and click the scan button</p>
    </div>
  )
  const scanBtn = !isScanning
    ? <ScanButton {...props} />
    : <Spinner className={styles.scan_button} />

  return (
    <div className={styles.scan_status}>
      {notFoundMessage}
      {scanBtn}
    </div>
  )
}
