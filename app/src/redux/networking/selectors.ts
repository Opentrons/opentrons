import { createSelector } from 'reselect'
import find from 'lodash/find'
import map from 'lodash/map'
import { long2ip } from 'netmask'

import { INTERFACE_WIFI, INTERFACE_ETHERNET } from './constants'

import type { State } from '../types'
import * as Types from './types'
import type { Dictionary } from 'lodash'

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
  (state: State, robotName: string) => state.networking[robotName]?.interfaces,
  interfaces => {
    const simpleIfaces = map(
      interfaces as Dictionary<Types.InterfaceStatus>,
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

export const getWifiKeys: (
  state: State,
  robotName: string
) => Types.WifiKey[] = createSelector(
  (state: State, robotName: string) => state.networking[robotName]?.wifiKeyIds,
  (state: State, robotName: string) =>
    state.networking[robotName]?.wifiKeysById,
  (
    ids: string[] = [],
    keysById: Partial<{ [id: string]: Types.WifiKey }> = {}
  ) => ids.map(id => keysById[id] as Types.WifiKey)
)

// NOTE: not memoized because used in several rendered components
// passing different requestIds simultaneously
export const getWifiKeyByRequestId = (
  state: State,
  robotName: string,
  reqId: string | null
): Types.WifiKey | null => {
  return reqId !== null
    ? getWifiKeys(state, robotName).find(k => k.requestId === reqId) ?? null
    : null
}

export const getEapOptions = (
  state: State,
  robotName: string
): Types.EapOption[] => {
  return state.networking[robotName]?.eapOptions ?? []
}
