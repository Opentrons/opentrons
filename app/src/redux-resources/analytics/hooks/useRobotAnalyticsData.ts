import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { useRobotSettingsQuery } from '@opentrons/react-api-client'

import { useRobot } from '/app/redux-resources/robots'
import {
  getRobotApiVersion,
  getRobotFirmwareVersion,
  getRobotSerialNumber,
} from '/app/redux/discovery'

import type { RobotAnalyticsData } from '/app/redux/analytics/types'
import type { State } from '/app/redux/types'

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
  const robotSettingsQuery = useRobotSettingsQuery()
  const settings = robotSettingsQuery.data?.settings ?? []
  const serialNumber =
    robot?.status != null ? getRobotSerialNumber(robot) : null

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
