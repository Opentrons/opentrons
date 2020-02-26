// @flow

import {
  SECURITY_WPA_PSK,
  SECURITY_WPA_EAP,
  SECURITY_NONE,
} from '../../../../../networking'

import type { WifiSecurityType } from '../../../../../networking'
import type { NetworkingType } from '../../types'

export const formatHeading = (
  ssid: ?string,
  previousSsid: ?string,
  networkingType: ?NetworkingType
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

type SecurityTypes = {|
  'wpa-psk': string,
  'wpa-eap': string,
  none: string,
|}

const securityTypes = (ssid: string): SecurityTypes => ({
  [SECURITY_WPA_PSK]: `Wi-Fi network ${ssid} requires a WPA2 password.`,
  [SECURITY_WPA_EAP]: `Wi-Fi network ${ssid} requires 802.1X authentication.`,
  [SECURITY_NONE]: `Please select the security type for Wi-Fi network ${ssid}.`,
})

export const formatBody = (
  ssid: ?string,
  previousSsid: ?string,
  networkingType: ?NetworkingType,
  securityType: ?WifiSecurityType
): ?string => {
  if (networkingType === 'join') {
    return 'Enter the name and security type of the network you want to join.'
  }

  if (previousSsid && networkingType === 'disconnect') {
    return `Are you sure you want to disconnect from ${previousSsid}?`
  }

  return ssid && securityType && securityTypes(ssid)[securityType]
}
