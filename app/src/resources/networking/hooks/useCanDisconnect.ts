import { useSelector } from 'react-redux'
import Semver from 'semver'
import { useIsOT3 } from '../../../organisms/Devices/hooks'
import { getRobotApiVersionByName } from '../../../redux/discovery'
import { useWifiList } from './useWifiList'

import type { State } from '../../../redux/types'

const API_MIN_DISCONNECT_VERSION = '3.17.0-alpha.0'

export const useCanDisconnect = (robotName: string): boolean => {
  const isOT3 = useIsOT3(robotName)
  const wifiList = useWifiList(robotName)
  const apiVersion = useSelector((state: State) => {
    return getRobotApiVersionByName(state, robotName)
  })

  const active = wifiList.some(nw => nw.active)
  const supportsDisconnect = Semver.valid(apiVersion)
    ? isOT3 || Semver.gte(apiVersion as string, API_MIN_DISCONNECT_VERSION)
    : false

  return Boolean(active && supportsDisconnect)
}
