import find from 'lodash/find'
import map from 'lodash/map'
import { long2ip } from 'netmask'
import { createSelector } from 'reselect'

import { INTERFACE_ETHERNET, INTERFACE_WIFI } from './constants'

import type { State } from '../types'
import type * as Types from './types'

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
      interfaces as Record<string, Types.InterfaceStatus>,
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

export const getEapOptions = (
  state: State,
  robotName: string
): Types.EapOption[] => {
  return state.networking[robotName]?.eapOptions ?? []
}
