// @flow

import type { WifiNetwork } from '../../../networking/types'

export const getActiveSsid = (list: Array<WifiNetwork>) => {
  const network = list.find(nw => nw.active)
  return network?.ssid || null
}

export const getSecurityType = (
  list: Array<WifiNetwork>,
  ssid: string | null
) => {
  if (!ssid) {
    return null
  }

  const network = list.find(nw => nw.ssid === ssid)
  return network?.securityType || null
}

export const hasSecurityType = (
  securityType: string | null,
  securityValue: string
) => securityType === securityValue
