import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useRobot } from '/app/redux-resources/robots'
import {
  getRobotApiVersion,
  getRobotFirmwareVersion,
  getRobotSerialNumber,
} from '/app/redux/discovery'
import { getAttachedPipettes } from '/app/redux/pipettes'
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
          robotLeftPipette: pipettes.left?.model ?? '',
          robotRightPipette: pipettes.right?.model ?? '',
          robotSerialNumber: serialNumber ?? '',
        }
      )
    }

      return null
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pipettes, robot, settings]
  )
}
