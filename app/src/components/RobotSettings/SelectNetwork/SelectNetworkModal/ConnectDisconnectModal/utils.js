// @flow

import {
  SECURITY_WPA_PSK,
  SECURITY_WPA_EAP,
  SECURITY_NONE,
} from '../../../../../networking'

import { DISCONNECT, JOIN_OTHER } from '../../constants'

import type { WifiSecurityType } from '../../../../../networking/types'
import type { NetworkChangeType } from '../../types'

const FIND_AND_JOIN = 'Find and join a Wi-Fi network'
const DISCONNECT_FROM_SSID = (previousSsid: string) =>
  `Disconnect from ${previousSsid}`
const CONNECT_TO_SSID = (ssid: string) => `Connect to ${ssid}`

export const formatHeading = (
  ssid: string | null,
  previousSsid: string | null,
  networkingType: NetworkChangeType
): string | null => {
  if (networkingType === JOIN_OTHER) {
    return FIND_AND_JOIN
  }

  if (previousSsid && networkingType === DISCONNECT) {
    return DISCONNECT_FROM_SSID(previousSsid)
  }

  if (ssid !== null) {
    return CONNECT_TO_SSID(ssid)
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
  networkingType: NetworkChangeType,
  securityType: WifiSecurityType | null
): string | null => {
  if (networkingType === JOIN_OTHER) {
    return 'Enter the name and security type of the network you want to join.'
  }

  if (previousSsid && networkingType === DISCONNECT) {
    return `Are you sure you want to disconnect from ${previousSsid}?`
  }

  return ssid && securityType && securityTypes(ssid)[securityType]
}
