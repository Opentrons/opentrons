// @flow
import * as React from 'react'

import {
  WPA_PSK_SECURITY,
  WPA_EAP_SECURITY,
  NO_SECURITY,
} from '../../../../../http-api-client'

import { ConnectForm } from './ConnectForm'
import { ScrollableAlertModal, BottomButtonBar } from '../../../../modals'

import { DISCONNECT } from '../../constants'

import styles from './styles.css'

import type {
  WifiSecurityType,
  WifiEapOptionsList,
  WifiConfigureRequest,
} from '../../../../../http-api-client'

export type ConnectDisconnectModalProps = {|
  ssid: ?string,
  previousSsid: ?string,
  networkingType: string, // Fix types once exported
  securityType: ?WifiSecurityType,
  handleCancel: () => mixed,
  addKey: () => mixed,
  handleDisconnectWifi: () => mixed,
  eapOptions: ?WifiEapOptionsList,
  keys: ?WifiKeysList,
  dispatchConfigure: WifiConfigureRequest => mixed,
|}

const heading = (
  ssid: ?string,
  previousSsid: ?string,
  networkingType: string
): ?string => {
  if (networkingType === 'join') {
    return 'Find and join a Wi-Fi network'
  }

  if (previousSsid && networkingType === 'disconnect') {
    return `Disconnect from ${previousSsid}`
  }

  if (ssid) {
    return `Connect to ${ssid}`
  }
}

// add return type
const securityTypes = (ssid: string): Object => ({
  [WPA_PSK_SECURITY]: `Wi-Fi network ${ssid} requires a WPA2 password.`,
  [WPA_EAP_SECURITY]: `Wi-Fi network ${ssid} requires 802.1X authentication.`,
  [NO_SECURITY]: `Please select the security type for Wi-Fi network ${ssid}.`,
})

// type this
const formatBody = (ssid, previousSsid, networkingType, securityType) => {
  if (networkingType === 'join') {
    return 'Enter the name and security type of the network you want to join.'
  }

  if (previousSsid && networkingType === 'disconnect') {
    return `Are you sure you want to disconnect from ${previousSsid}?`
  }

  return ssid && securityType && securityTypes(ssid)[securityType]
}

export const ConnectDisconnectModal = ({
  ssid,
  previousSsid,
  networkingType,
  securityType,
  handleCancel,
  handleDisconnectWifi,
  eapOptions,
  keys,
  dispatchConfigure,
  addKey,
}: ConnectDisconnectModalProps) => (
  <ScrollableAlertModal
    alertOverlay
    heading={heading(ssid, previousSsid, networkingType)}
    iconName="wifi"
    onCloseClick={handleCancel}
  >
    <p className={styles.connect_modal_copy}>
      {formatBody(ssid, previousSsid, networkingType, securityType)}
    </p>
    {networkingType === DISCONNECT ? (
      <BottomButtonBar
        buttons={[
          { children: 'Cancel', onClick: handleCancel },
          {
            children: 'Disconnect',
            onClick: handleDisconnectWifi,
          },
        ]}
      />
    ) : (
      <ConnectForm
        ssid={ssid}
        securityType={securityType}
        eapOptions={eapOptions}
        keys={keys}
        configure={dispatchConfigure}
        close={handleCancel}
        addKey={addKey}
      />
    )}
  </ScrollableAlertModal>
)
