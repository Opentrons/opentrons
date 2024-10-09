import { useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRobot } from '/app/redux-resources/robots'
import { getAttachedPipettes } from '/app/redux/pipettes'
import { getRobotSettings, fetchSettings } from '/app/redux/robot-settings'
import {
  getRobotApiVersion,
  getRobotFirmwareVersion,
  getRobotSerialNumber,
} from '/app/redux/discovery'

import type { State, Dispatch } from '/app/redux/types'
import type { RobotAnalyticsData } from '/app/redux/analytics/types'

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
  const pipettes = useSelector((state: State) =>
    getAttachedPipettes(state, robotName)
  )
  const settings = useSelector((state: State) =>
    getRobotSettings(state, robotName)
  )
  const serialNumber =
    robot?.status != null ? getRobotSerialNumber(robot) : null
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    dispatch(fetchSettings(robotName))
  }, [dispatch, robotName])

  // @ts-expect-error RobotAnalyticsData type needs boolean values should it be boolean | string
  return useMemo(() => {
    if (robot != null) {
      return settings.reduce<RobotAnalyticsData>(
        (result, setting) => ({
          ...result,
          [`${FF_PREFIX}${setting.id}`]: !!(setting?.value ?? false),
        }),
        // @ts-expect-error RobotAnalyticsData type needs boolean values should it be boolean | string
        {
          robotApiServerVersion: getRobotApiVersion(robot) ?? '',
          robotSmoothieVersion: getRobotFirmwareVersion(robot) ?? '',
          robotLeftPipette: pipettes.left?.model ?? '',
          robotRightPipette: pipettes.right?.model ?? '',
          robotSerialNumber: serialNumber ?? '',
        }
      )
    }

    return null
  }, [pipettes, robot, settings])
}
