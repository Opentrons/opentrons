// @flow
import * as React from 'react'
import {IconButton, REFRESH, SPINNER} from '@opentrons/components'

import styles from './connect-panel.css'

type Props = {
  isScanning: boolean,
  onScanClick: () => void,
  inTitleBar?: boolean
}

export default function ScanButton (props: Props) {
  const {isScanning} = props
  const iconName = isScanning
    ? SPINNER
    : REFRESH

  const className = props.inTitleBar
    ? styles.title_scan_button
    : styles.scan_button

  return (
    <IconButton
      title='Scan for robots'
      onClick={props.onScanClick}
      className={className}
      name={iconName}
      spin={isScanning}
      disabled={isScanning}
    />
  )
}
