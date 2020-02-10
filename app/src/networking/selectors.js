// @flow

import find from 'lodash/find'
import map from 'lodash/map'
import { long2ip } from 'netmask'

import type { State } from '../types'
import * as Types from './types'

export function getInternetStatus(
  state: State,
  robotName: string
): Types.InternetStatus | null {
  const status = state.networking[robotName]?.internetStatus

  return status != null ? status : null
}

export function getNetworkInterfaces(
  state: State,
  robotName: string
): Types.InterfaceStatusByType {
  const interfaces = state.networking[robotName]?.interfaces
  const simpleInterfaces = map(
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

  const wifi = find(simpleInterfaces, { type: 'wifi' }) || null
  const ethernet = find(simpleInterfaces, { type: 'ethernet' }) || null

  return { wifi, ethernet }
}
