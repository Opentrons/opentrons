import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRobot } from './'
import { getAttachedPipettes } from '../../../redux/pipettes'
import { getRobotSettings, fetchSettings } from '../../../redux/robot-settings'
import {
  getRobotApiVersion,
  getRobotFirmwareVersion,
} from '../../../redux/discovery'

import type { State, Dispatch } from '../../../redux/types'
import type { RobotAnalyticsData } from '../../../redux/analytics/types'

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
  const dispatch = useDispatch<Dispatch>()

  React.useEffect(() => {
    dispatch(fetchSettings(robotName))
  }, [dispatch, robotName])

  // @ts-expect-error RobotAnalyticsData type needs boolean values should it be boolean | string
  return React.useMemo(() => {
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
        }
      )
    }

    return null
  }, [pipettes, robot, settings])
}
