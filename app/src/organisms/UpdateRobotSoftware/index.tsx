import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { Dispatch } from '../../redux/types'

import {
  getRobotUpdateSession,
  startRobotUpdate,
} from '../../redux/robot-update'

import type { ViewableRobot } from '../../redux/discovery/types'

import { CompleteUpdateSoftware } from '../../organisms/UpdateRobotSoftware/CompleteUpdateSoftware'
import { UpdateSoftware } from '../../organisms/UpdateRobotSoftware/UpdateSoftware'

import { CheckUpdates } from './CheckUpdates'
import { NoUpdateFound } from './NoUpdateFound'
import { ErrorUpdateSoftware } from './ErrorUpdateSoftware'
export {
  CheckUpdates,
  NoUpdateFound,
  ErrorUpdateSoftware,
  CompleteUpdateSoftware,
  UpdateSoftware,
}

interface UpdateRobotSoftwareProps {
  localRobot: ViewableRobot
  afterError: (errorMessage: string) => void
  beforeCommittingSuccessfulUpdate?: () => void
}

export function UpdateRobotSoftware(
  props: UpdateRobotSoftwareProps
): JSX.Element {
  const { localRobot, afterError, beforeCommittingSuccessfulUpdate } = props
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const dispatch = useDispatch<Dispatch>()

  const session = useSelector(getRobotUpdateSession)
  const { step, stage, progress, error: sessionError } = session ?? {
    step: null,
    error: null,
  }
  const [isDownloading, setIsDownloading] = React.useState<boolean>(false)

  React.useEffect(() => {
    // check isDownloading to avoid dispatching again
    if (!isDownloading) {
      setIsDownloading(true)
      dispatch(startRobotUpdate(robotName))
    }
  }, [dispatch, robotName, isDownloading])

  // Display Error screen
  if (sessionError != null) {
    afterError(sessionError)
  }
  let updateType:
    | 'downloading'
    | 'validating'
    | 'sendingFile'
    | 'installing'
    | null = null
  if (step === 'finished') {
    return <CompleteUpdateSoftware robotName={robotName} />
  } else {
    if (isDownloading && (step === 'restart' || step === 'restarting')) {
      updateType = 'downloading'
    } else if (step === 'getToken' || step === 'uploadFile') {
      updateType = 'sendingFile'
    } else if (step === 'processFile' || step === 'commitUpdate') {
      if (stage === 'awaiting-file' || stage === 'validating') {
        updateType = 'validating'
      } else {
        updateType = 'installing'
        beforeCommittingSuccessfulUpdate && beforeCommittingSuccessfulUpdate()
      }
    }
    return (
      <UpdateSoftware
        updateType={updateType}
        processProgress={progress != null ? progress : 0}
      />
    )
  }
}
