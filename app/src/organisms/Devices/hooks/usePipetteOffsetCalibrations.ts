import React from 'react'
import { useSelector } from 'react-redux'

import {
  fetchPipetteOffsetCalibrations,
  getPipetteOffsetCalibrations,
} from '../../../redux/calibration'
import { useDispatchApiRequest } from '../../../redux/robot-api'

import type { PipetteOffsetCalibration } from '../../../redux/calibration/types'
import type { State } from '../../../redux/types'

export function usePipetteOffsetCalibrations(
  robotName: string | null = null
): PipetteOffsetCalibration[] | null {
  const [dispatchRequest] = useDispatchApiRequest()

  const pipetteOffsetCalibrations = useSelector((state: State) =>
    getPipetteOffsetCalibrations(state, robotName)
  )

  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchPipetteOffsetCalibrations(robotName))
    }
  }, [dispatchRequest, robotName])

  return pipetteOffsetCalibrations
}
