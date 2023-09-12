import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  setRobotUpdateSeen,
  robotUpdateIgnored,
  getRobotUpdateSession,
  getRobotSystemType,
  getRobotUpdateAvailable,
} from '../../../../redux/robot-update'
import { ViewUpdateModal } from './ViewUpdateModal'
import { RobotUpdateProgressModal } from './RobotUpdateProgressModal'

import type { State, Dispatch } from '../../../../redux/types'
import type { ViewableRobot } from '../../../../redux/discovery/types'

export type UpdateStep = 'download' | 'install' | 'restart' | 'finished'

export interface UpdateBuildrootProps {
  robot: ViewableRobot
  close: () => void
}

export function UpdateBuildroot(props: UpdateBuildrootProps): JSX.Element {
  const { robot, close } = props
  const robotName = robot.name
  const session = useSelector(getRobotUpdateSession)
  const robotUpdateType = useSelector((state: State) =>
    getRobotUpdateAvailable(state, robot)
  )
  const dispatch = useDispatch<Dispatch>()
  const { step, error: installError } = session || {
    step: null,
    installError: null,
  }

  // set update seen on component mount
  React.useEffect(() => {
    dispatch(setRobotUpdateSeen(robotName))
  }, [robotName])

  const ignoreUpdate = React.useCallback(() => {
    dispatch(robotUpdateIgnored(robotName))
    close()
  }, [robotName, close])

  const robotSystemType = getRobotSystemType(robot)

  let updateStep: UpdateStep
  if (step == null) updateStep = 'download'
  else if (step === 'finished') updateStep = 'finished'
  else if (step === 'restart' || step === 'restarting') updateStep = 'restart'
  else updateStep = 'install'

  return session ? (
    <RobotUpdateProgressModal
      robotName={robotName}
      updateStep={updateStep}
      stepProgress={session.progress}
      error={installError}
      closeUpdateBuildroot={close}
    />
  ) : (
    <ViewUpdateModal
      robotName={robotName}
      robotUpdateType={robotUpdateType}
      robotSystemType={robotSystemType}
      closeModal={ignoreUpdate}
    />
  )
}
