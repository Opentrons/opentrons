import { SECURITY_WPA_EAP } from '../types'

import type { WifiListResponse, WifiNetwork } from '../types'

export const mockWifiNetwork: WifiNetwork = {
  ssid: 'linksys',
  signal: 50,
  active: false,
  security: 'WPA2 802.1X',
  securityType: SECURITY_WPA_EAP,
}

export const mockWifiList: WifiListResponse = { list: [mockWifiNetwork] }
