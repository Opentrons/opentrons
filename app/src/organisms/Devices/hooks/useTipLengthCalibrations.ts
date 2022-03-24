import React from 'react'
import { useSelector } from 'react-redux'

import {
  fetchTipLengthCalibrations,
  getTipLengthCalibrations,
} from '../../../redux/calibration'
import { useDispatchApiRequest } from '../../../redux/robot-api'

import type { TipLengthCalibration } from '../../../redux/calibration/types'
import type { State } from '../../../redux/types'

export function useTipLengthCalibrations(
  robotName: string | null = null
): TipLengthCalibration[] | null {
  const [dispatchRequest] = useDispatchApiRequest()

  const tipLengthCalibrations = useSelector((state: State) =>
    getTipLengthCalibrations(state, robotName)
  )

  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchTipLengthCalibrations(robotName))
    }
  }, [dispatchRequest, robotName])

  return tipLengthCalibrations
}
