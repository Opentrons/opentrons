import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  setRobotUpdateSeen,
  robotUpdateIgnored,
  getRobotUpdateSession,
} from '../../../../redux/robot-update'
import { ViewUpdateModal } from './ViewUpdateModal'
import { RobotUpdateProgressModal } from './RobotUpdateProgressModal'
import { UNREACHABLE } from '../../../../redux/discovery'

import type { Dispatch } from '../../../../redux/types'
import type { DiscoveredRobot } from '../../../../redux/discovery/types'

export interface UpdateBuildrootProps {
  close: () => void
  robot?: DiscoveredRobot | null
}

export function UpdateBuildroot(
  props: UpdateBuildrootProps
): JSX.Element | null {
  const { robot, close } = props
  const hasSeenSessionOnce = React.useRef<boolean>(false)
  const robotName = React.useRef<string>(robot?.name ?? '')
  const dispatch = useDispatch<Dispatch>()
  const session = useSelector(getRobotUpdateSession)
  if (!hasSeenSessionOnce.current && session) hasSeenSessionOnce.current = true

  React.useEffect(() => {
    if (robotName.current) {
      dispatch(setRobotUpdateSeen(robotName.current))
    }
  }, [robotName])

  const ignoreUpdate = React.useCallback(() => {
    if (robotName.current) {
      dispatch(robotUpdateIgnored(robotName.current))
    }
    close()
  }, [robotName, close])

  if (hasSeenSessionOnce.current)
    return (
      <RobotUpdateProgressModal
        robotName={robotName.current}
        session={session}
        closeUpdateBuildroot={close}
      />
    )
  else if (robot != null && robot.status !== UNREACHABLE)
    return (
      <ViewUpdateModal
        robotName={robotName.current}
        robot={robot}
        closeModal={ignoreUpdate}
      />
    )
  else return null
}
