import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { useRobot } from '/app/redux-resources/robots'
import { useAccessTokenForRobot } from '/app/redux/robot-auth/hooks'
import { getRobotUpdateSessionRobotName } from '/app/redux/robot-update'

import { buildHostConfig } from './buildHostConfig'

import type { HostConfig } from '@opentrons/api-client'
import type { State } from '/app/redux/types'

/**
 * HostConfig for the robot currently being updated (session robot).
 */
export function useRobotUpdateHostConfig(): HostConfig | null {
  const robotName = useSelector((state: State) =>
    getRobotUpdateSessionRobotName(state)
  )
  const robot = useRobot(robotName)
  const token = useAccessTokenForRobot(robotName)

  return useMemo(() => {
    if (robotName == null || robot?.ip == null) {
      return null
    }
    return buildHostConfig(
      { ip: robot.ip, port: robot.port, name: robotName },
      token
    )
  }, [robot?.ip, robot?.port, robotName, token])
}
