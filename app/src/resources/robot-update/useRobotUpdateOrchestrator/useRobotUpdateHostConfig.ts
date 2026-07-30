import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { useRobot } from '/app/redux-resources/robots'
import { OPENTRONS_USB } from '/app/redux/discovery/constants'
import { useAccessTokenForRobot } from '/app/redux/robot-auth/hooks'
import { getRobotUpdateSessionRobotName } from '/app/redux/robot-update'
import { appShellUSBRequestor } from '/app/redux/shell/remote'

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
    return {
      hostname: robot.ip,
      port: robot.port,
      robotName,
      token,
      requestor: robot.ip === OPENTRONS_USB ? appShellUSBRequestor : undefined,
    }
  }, [robot?.ip, robot?.port, robotName, token])
}
