// @flow

import find from 'lodash/find'
import map from 'lodash/map'
import { Netmask } from 'netmask'

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
      const { macAddress, type } = iface
      let ipAddress = iface.ipAddress
      let subnetMask: string | null = null

      if (ipAddress != null) {
        try {
          const block = new Netmask(ipAddress)
          subnetMask = block.mask
          ipAddress = ipAddress.split('/')[0]
        } catch (e) {}
      }

      return { ipAddress, subnetMask, macAddress, type }
    }
  )

  const wifi = find(simpleInterfaces, { type: 'wifi' }) || null
  const ethernet = find(simpleInterfaces, { type: 'ethernet' }) || null

  return { wifi, ethernet }
}
