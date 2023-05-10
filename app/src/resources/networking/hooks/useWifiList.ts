import uniqBy from 'lodash/uniqBy'
import orderBy from 'lodash/orderBy'
import { useWifiQuery } from '@opentrons/react-api-client'
import { useRobot } from '../../../organisms/Devices/hooks'

import type { WifiNetwork } from '@opentrons/api-client'

const LIST_ORDER = [
  ['active', 'ssid'],
  ['desc', 'asc'],
]

// if no robot name is given let React Query provide the host
export const useWifiList = (
  robotName?: string,
  refetchInterval?: number
): WifiNetwork[] => {
  const robot = useRobot(robotName ?? null)
  const hostConfig =
    robot?.ip != null
      ? {
          hostname: robot.ip,
          port: robot?.port,
          robotName: robotName,
        }
      : null

  const wifiQuery = useWifiQuery(
    { refetchInterval: refetchInterval ?? false },
    hostConfig
  )
  const wifiList = wifiQuery.data?.list != null ? wifiQuery.data?.list : []

  return uniqBy(orderBy(wifiList, ...LIST_ORDER), 'ssid')
}
