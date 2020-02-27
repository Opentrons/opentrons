// @flow

import {
  SECURITY_WPA_PSK,
  SECURITY_WPA_EAP,
  SECURITY_NONE,
} from '../../../../../networking'

import type { WifiSecurityType } from '../../../../../networking/types'
import type { NetworkingType } from '../../types'

const JOIN = 'Find and join a Wi-Fi network'
const DISCONNECT = (previousSsid: string) => `Disconnect from ${previousSsid}`
const CONNECT = (ssid: string) => `Connect to ${ssid}`

export const formatHeading = (
  ssid: string | null,
  previousSsid: string | null,
  networkingType: NetworkingType | null
): string | null => {
  if (networkingType === 'join') {
    return JOIN
  }

  if (previousSsid && networkingType === 'disconnect') {
    return DISCONNECT(previousSsid)
  }

  if (ssid !== null) {
    return CONNECT(ssid)
  }

  return null
}

const securityTypes = (ssid: string) => ({
  [SECURITY_WPA_PSK]: `Wi-Fi network ${ssid} requires a WPA2 password.`,
  [SECURITY_WPA_EAP]: `Wi-Fi network ${ssid} requires 802.1X authentication.`,
  [SECURITY_NONE]: `Please select the security type for Wi-Fi network ${ssid}.`,
})

export const formatBody = (
  ssid: string | null,
  previousSsid: string | null,
  networkingType: NetworkingType | null,
  securityType: WifiSecurityType | null
): string | null => {
  if (networkingType === 'join') {
    return 'Enter the name and security type of the network you want to join.'
  }

  if (previousSsid && networkingType === 'disconnect') {
    return `Are you sure you want to disconnect from ${previousSsid}?`
  }

  return ssid && securityType && securityTypes(ssid)[securityType]
}
