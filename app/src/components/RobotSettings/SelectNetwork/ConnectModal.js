// @flow
import * as React from 'react'

import { WPA_PSK_SECURITY, WPA_EAP_SECURITY } from '../../../http-api-client'
import { ScrollableAlertModal } from '../../modals'
import styles from './styles.css'

import type { WifiSecurityType } from '../../../http-api-client'

export type ConnectModalProps = {|
  ssid: ?string,
  securityType: ?WifiSecurityType,
  close: () => mixed,
  children: React.Node,
|}

export function ConnectModal(props: ConnectModalProps) {
  const { ssid, securityType, close, children } = props
  const heading = ssid ? `Connect to ${ssid}` : 'Find and join a Wi-Fi network'
  let body = ''

  if (ssid) {
    if (securityType === WPA_PSK_SECURITY) {
      body = `Wi-Fi network ${ssid} requires a WPA2 password.`
    } else if (securityType === WPA_EAP_SECURITY) {
      body = `Wi-Fi network ${ssid} requires 802.1X authentication.`
    } else {
      body = `Please select the security type for Wi-Fi network ${ssid}.`
    }
  } else {
    body = 'Enter the name and security type of the network you want to join.'
  }

  return (
    <ScrollableAlertModal
      alertOverlay
      heading={heading}
      iconName="wifi"
      onCloseClick={close}
    >
      <p className={styles.connect_modal_copy}>{body}</p>
      {children}
    </ScrollableAlertModal>
  )
}
