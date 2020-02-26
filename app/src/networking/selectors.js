// @flow
import { createSelector } from 'reselect'
import find from 'lodash/find'
import map from 'lodash/map'
import orderBy from 'lodash/orderBy'
import uniqBy from 'lodash/uniqBy'
import { long2ip } from 'netmask'

import { INTERFACE_WIFI, INTERFACE_ETHERNET } from './constants'

import type { State } from '../types'
import * as Types from './types'

export function getInternetStatus(
  state: State,
  robotName: string
): Types.InternetStatus | null {
  return state.networking[robotName]?.internetStatus ?? null
}

export const getNetworkInterfaces: (
  state: State,
  robotName: string
) => Types.InterfaceStatusByType = createSelector(
  (state, robotName) => state.networking[robotName]?.interfaces,
  interfaces => {
    const simpleIfaces = map(
      interfaces,
      (iface: Types.InterfaceStatus): Types.SimpleInterfaceStatus => {
        const { ipAddress: ipWithMask, macAddress, type } = iface
        let ipAddress: string | null = null
        let subnetMask: string | null = null

        if (ipWithMask != null) {
          const [ip, mask] = ipWithMask.split('/')
          const activeMaskBits = mask ? Number(mask) : null
          ipAddress = ip
          subnetMask =
            activeMaskBits && Number.isFinite(activeMaskBits)
              ? long2ip((0xffffffff << (32 - activeMaskBits)) >>> 0)
              : null
        }

        return { ipAddress, subnetMask, macAddress, type }
      }
    )

    const wifi = find(simpleIfaces, { type: INTERFACE_WIFI }) ?? null
    const ethernet = find(simpleIfaces, { type: INTERFACE_ETHERNET }) ?? null

    return { wifi, ethernet }
  }
)

const LIST_ORDER = [['active', 'ssid'], ['desc', 'asc']]

export const getWifiList: (
  state: State,
  robotName: string
) => Array<Types.WifiNetwork> = createSelector(
  (state, robotName) => state.networking[robotName]?.wifiList,
  (wifiList = []) => orderBy(uniqBy(wifiList, 'ssid'), ...LIST_ORDER)
)

export const getWifiKeys = (
  state: State,
  robotName: string
): Array<Types.WifiKey> => {
  return state.networking[robotName]?.wifiKeys ?? []
}
