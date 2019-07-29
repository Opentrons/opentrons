// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import VersionInfoModal from './VersionInfoModal'
import ViewUpdateModal from './ViewUpdateModal'
import InstallModal from './InstallModal'
import {
  startBuildrootUpdate,
  setBuildrootUpdateSeen,
  getBuildrootSession,
  getRobotSystemType,
  compareRobotVersionToUpdate,
} from '../../../shell'

import type { Dispatch } from '../../../types'
import type { ViewableRobot } from '../../../discovery'

type Props = {|
  robot: ViewableRobot,
  close: () => mixed,
|}

export default function UpdateBuildroot(props: Props) {
  const { robot, close } = props
  const robotName = robot.name
  const [viewUpdateInfo, setViewUpdateInfo] = React.useState(false)
  const session = useSelector(getBuildrootSession)
  const dispatch = useDispatch<Dispatch>()

  // set update seen on component mount
  React.useEffect(() => {
    dispatch(setBuildrootUpdateSeen())
  }, [dispatch])

  const goToViewUpdate = React.useCallback(() => setViewUpdateInfo(true), [])

  const installUpdate = React.useCallback(
    () => dispatch(startBuildrootUpdate(robotName)),
    [dispatch, robotName]
  )

  const robotSystemType = getRobotSystemType(robot)
  const robotUpdateType = compareRobotVersionToUpdate(robot)

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
        close={close}
        proceed={goToViewUpdate}
      />
    )
  }

  return (
    <ViewUpdateModal
      robotUpdateType={robotUpdateType}
      robotSystemType={robotSystemType}
      close={close}
      proceed={installUpdate}
    />
  )
}
