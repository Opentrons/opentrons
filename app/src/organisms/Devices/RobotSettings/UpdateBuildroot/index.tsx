import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { VersionInfoModal } from './VersionInfoModal'
import { ViewUpdateModal } from './ViewUpdateModal'
import { InstallModal } from './InstallModal'
import {
  startRobotUpdate,
  setRobotUpdateSeen,
  robotUpdateIgnored,
  getRobotUpdateSession,
  clearRobotUpdateSession,
  getRobotSystemType,
  getRobotUpdateAvailable,
} from '../../../../redux/robot-update'

import type { State, Dispatch } from '../../../../redux/types'
import type { ViewableRobot } from '../../../../redux/discovery/types'

export interface UpdateBuildrootProps {
  robot: ViewableRobot
  close: () => unknown
}

export function UpdateBuildroot(props: UpdateBuildrootProps): JSX.Element {
  const { robot, close } = props
  const robotName = robot.name
  const [viewUpdateInfo, setViewUpdateInfo] = React.useState(false)
  const session = useSelector(getRobotUpdateSession)
  const robotUpdateType = useSelector((state: State) =>
    getRobotUpdateAvailable(state, robot)
  )
  const dispatch = useDispatch<Dispatch>()
  const { step, error } = session || { step: null, error: null }

  // set update seen on component mount
  React.useEffect(() => {
    dispatch(setRobotUpdateSeen(robotName))
  }, [dispatch, robotName])

  // TODO(bc, 2022-07-05): We are currently ignoring the 'finished' session state, but
  // when new SW Update flow is made, delete this implicit dismissal that
  // clears buildroot state if session finished when initially mounted
  React.useEffect(() => {
    if (step === 'finished') {
      dispatch(clearRobotUpdateSession())
    }
  }, [dispatch, step])

  // clear buildroot state on component dismount if done
  React.useEffect(() => {
    if (step === 'finished' || error !== null) {
      return () => {
        dispatch(clearRobotUpdateSession())
      }
    }
  }, [dispatch, step, error])

  const goToViewUpdate = React.useCallback(() => setViewUpdateInfo(true), [])

  const ignoreUpdate = React.useCallback(() => {
    dispatch(robotUpdateIgnored(robotName))
    close()
  }, [dispatch, robotName, close])

  const installUpdate = React.useCallback(
    () => dispatch(startRobotUpdate(robotName)),
    [dispatch, robotName]
  )

  const robotSystemType = getRobotSystemType(robot)

  if (session) {
    return (
      <InstallModal
        robot={robot}
        robotSystemType={robotSystemType}
        session={session}
        close={close}
      />
    )
  }

  if (!viewUpdateInfo) {
    return (
      <VersionInfoModal
        robot={robot}
        robotUpdateType={robotUpdateType}
        close={ignoreUpdate}
        goToViewUpdate={goToViewUpdate}
        installUpdate={installUpdate}
      />
    )
  }

  return (
    <ViewUpdateModal
      robotName={robotName}
      robotUpdateType={robotUpdateType}
      robotSystemType={robotSystemType}
      close={ignoreUpdate}
      proceed={installUpdate}
    />
  )
}
