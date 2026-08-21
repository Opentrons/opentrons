import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { CompleteUpdateSoftware } from '/app/organisms/UpdateRobotSoftware/CompleteUpdateSoftware'
import { UpdateSoftware } from '/app/organisms/UpdateRobotSoftware/UpdateSoftware'
import {
  downloadRobotUpdate,
  getRobotUpdateSession,
} from '/app/redux/robot-update'
import { useRobotUpdateContext } from '/app/resources/robot-update/RobotUpdateContext'

import { CheckUpdates } from './CheckUpdates'
import { ErrorUpdateSoftware } from './ErrorUpdateSoftware'
import { NoUpdateFound } from './NoUpdateFound'

import type { ViewableRobot } from '/app/redux/discovery/types'
import type { Dispatch } from '/app/redux/types'

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
  afterCancel: () => void
}

export function UpdateRobotSoftware(
  props: UpdateRobotSoftwareProps
): JSX.Element {
  const {
    localRobot,
    afterError,
    beforeCommittingSuccessfulUpdate,
    afterCancel,
  } = props
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const dispatch = useDispatch<Dispatch>()
  const { startUpdate } = useRobotUpdateContext()

  const session = useSelector(getRobotUpdateSession)
  const {
    step,
    stage,
    error: sessionError,
  } = session ?? {
    step: null,
    error: null,
  }
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const afterCancelRef = useRef(afterCancel)
  afterCancelRef.current = afterCancel
  const hadSessionRef = useRef(session != null)
  const didCancelRef = useRef(false)

  if (session != null) {
    hadSessionRef.current = true
  }

  useEffect(() => {
    // check isDownloading to avoid dispatching again
    if (!isDownloading) {
      setIsDownloading(true)
      dispatch(downloadRobotUpdate())
      startUpdate(robotName)
    }
  }, [dispatch, startUpdate, robotName, isDownloading])

  useEffect(() => {
    if (session == null && hadSessionRef.current && !didCancelRef.current) {
      didCancelRef.current = true
      afterCancelRef.current()
    }
  }, [session])

  // Display Error screen
  if (sessionError != null) {
    afterError(sessionError)
  }
  let updateType:
    'downloading' | 'validating' | 'sendingFile' | 'installing' | null = null
  if (step === 'finished') {
    return <CompleteUpdateSoftware robotName={robotName} />
  } else {
    if (step === 'getToken' || step === 'uploadFile') {
      updateType = 'sendingFile'
    } else if (step === 'processFile' || step === 'commitUpdate') {
      if (stage === 'awaiting-file' || stage === 'validating') {
        updateType = 'validating'
      } else {
        updateType = 'installing'
        beforeCommittingSuccessfulUpdate && beforeCommittingSuccessfulUpdate()
      }
    } else if (isDownloading) {
      updateType = 'downloading'
    }
    return <UpdateSoftware updateType={updateType} />
  }
}
