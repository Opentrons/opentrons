import find from 'lodash/find'
import map from 'lodash/map'
import { long2ip } from 'netmask'

import { INTERFACE_ETHERNET, INTERFACE_WIFI } from '@opentrons/api-client'
import { useNetworkingStatusQuery } from '@opentrons/react-api-client'

import { useRobot } from '/app/redux-resources/robots'

import type {
  InterfaceStatus,
  InterfaceStatusMap,
  InterfaceType,
} from '@opentrons/api-client'

export interface SimpleInterfaceStatus {
  ipAddress: string | null
  subnetMask: string | null
  macAddress: string
  type: InterfaceType
}

export interface InterfaceStatusByType {
  wifi: SimpleInterfaceStatus | null
  ethernet: SimpleInterfaceStatus | null
}

export function getInterfaceStatusByType(
  interfaces: InterfaceStatusMap | null | undefined
): InterfaceStatusByType {
  if (interfaces == null) {
    return { wifi: null, ethernet: null }
  }

  const simpleIfaces = map(
    interfaces as Record<string, InterfaceStatus>,
    (iface: InterfaceStatus): SimpleInterfaceStatus => {
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

// if no robot name is given let React Query provide the host
export function useNetworkInterfaces(
  robotName?: string,
  refetchInterval?: number
): InterfaceStatusByType {
  const robot = useRobot(robotName ?? null)
  const hostConfig =
    robot?.ip != null
      ? {
          hostname: robot.ip,
          port: robot?.port,
          robotName: robotName,
        }
      : null

  const { data } = useNetworkingStatusQuery(
    { refetchInterval: refetchInterval ?? false },
    hostConfig
  )

  return getInterfaceStatusByType(data?.interfaces)
}
