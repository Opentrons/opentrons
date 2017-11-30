import React from 'react'
import PropTypes from 'prop-types'

import Button from '../../Button'
import {Spinner} from '../../icons'
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

  return (
    <div className={styles.scan_status}>
      {notFoundMessage}
      <ScanButton {...props} />
    </div>
  )
}

function ScanButton (props) {
  const {isScanning, onScanClick} = props

  if (isScanning) return (<Spinner className={styles.scan_button} />)

  // TODO(mc, 2017-11-13): use a proper SVG icon
  return (
    <Button
      style={styles.scan_button}
      onClick={onScanClick}
      title='Scan for robots'
    >
      &#x21ba;
    </Button>
  )
}
