import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useRobot } from '/app/redux-resources/robots'
import {
  getRobotApiVersion,
  getRobotFirmwareVersion,
  getRobotSerialNumber,
} from '/app/redux/discovery'
import { fetchSettings, getRobotSettings } from '/app/redux/robot-settings'

import type { RobotAnalyticsData } from '/app/redux/analytics/types'
import type { Dispatch, State } from '/app/redux/types'

const FF_PREFIX = 'robotFF_'

/**
 *
 * @param   {string} robotName
 * @returns {RobotAnalyticsData}
 *          for use in trackEvent
 */
export function useRobotAnalyticsData(
  robotName: string
): RobotAnalyticsData | null {
  const robot = useRobot(robotName)
  const settings = useSelector((state: State) =>
    getRobotSettings(state, robotName)
  )
  const serialNumber =
    robot?.status != null ? getRobotSerialNumber(robot) : null
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    dispatch(fetchSettings(robotName))
  }, [dispatch, robotName])

  return useMemo(() => {
    if (robot != null) {
      return settings.reduce<RobotAnalyticsData>(
        (result, setting) => ({
          ...result,
          [`${FF_PREFIX}${setting.id}`]: !!(setting?.value ?? false),
        }),
        {
          robotApiServerVersion: getRobotApiVersion(robot) ?? '',
          robotSmoothieVersion: getRobotFirmwareVersion(robot) ?? '',
          robotSerialNumber: serialNumber ?? '',
        }
      )
    }

    return null
  }, [robot, settings, serialNumber])
}
