import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { VersionInfoModal } from './VersionInfoModal'
import { ViewUpdateModal } from './ViewUpdateModal'
import { InstallModal } from './InstallModal'
import {
  startBuildrootUpdate,
  setBuildrootUpdateSeen,
  buildrootUpdateIgnored,
  getBuildrootSession,
  clearBuildrootSession,
  getRobotSystemType,
  getBuildrootUpdateAvailable,
} from '../../../../redux/buildroot'

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
  const session = useSelector(getBuildrootSession)
  const robotUpdateType = useSelector((state: State) =>
    getBuildrootUpdateAvailable(state, robot)
  )
  const dispatch = useDispatch<Dispatch>()
  const { step, error } = session || { step: null, error: null }
  console.log('step: ', step)

  // set update seen on component mount
  React.useEffect(() => {
    dispatch(setBuildrootUpdateSeen(robotName))
  }, [dispatch, robotName])

  // TODO(bc, 2022-07-05): We are currently ignoring the 'finished' session state, but
  // when new SW Update flow is made, delete this implicit dismissal that
  // clears buildroot state if session finished when initially mounted
  React.useEffect(() => {
    if (step === 'finished') {
      console.log('clearing buildroot session')
      dispatch(clearBuildrootSession())
    }
  }, [dispatch, step])

  // clear buildroot state on component dismount if done
  React.useEffect(() => {
    if (step === 'finished' || error !== null) {
      return () => {
        console.log('clearing buildroot session')
        dispatch(clearBuildrootSession())
      }
    }
  }, [dispatch, step, error])

  const goToViewUpdate = React.useCallback(() => setViewUpdateInfo(true), [])

  const ignoreUpdate = React.useCallback(() => {
    dispatch(buildrootUpdateIgnored(robotName))
    close()
  }, [dispatch, robotName, close])

  const installUpdate = React.useCallback(
    () => dispatch(startBuildrootUpdate(robotName)),
    [dispatch, robotName]
  )

  const robotSystemType = getRobotSystemType(robot)
  console.log('session: ', session)

  if (session) {
    console.log('session present, rendering install modal')
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
        proceed={goToViewUpdate}
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
