import React from 'react'
import { useSelector } from 'react-redux'

import {
  fetchPipetteOffsetCalibrations,
  fetchTipLengthCalibrations,
} from '../../../redux/calibration'
import {
  fetchPipettes,
  getAttachedPipetteCalibrations,
} from '../../../redux/pipettes'
import { useDispatchApiRequest } from '../../../redux/robot-api'

import type { PipetteCalibrationsByMount } from '../../../redux/pipettes/types'
import type { State } from '../../../redux/types'

export function useAttachedPipetteCalibrations(
  robotName: string | null
): PipetteCalibrationsByMount {
  const [dispatchRequest] = useDispatchApiRequest()

  const attachedPipettes = useSelector((state: State) =>
    getAttachedPipetteCalibrations(state, robotName)
  )

  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchPipettes(robotName))
      dispatchRequest(fetchPipetteOffsetCalibrations(robotName))
      dispatchRequest(fetchTipLengthCalibrations(robotName))
    }
  }, [dispatchRequest, robotName])

  return attachedPipettes
}
