import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import {
  getCalibrationForPipette,
  fetchPipetteOffsetCalibrations,
} from '/app/redux/calibration'
import { useDispatchApiRequest } from '/app/redux/robot-api'
import { useRobot } from '/app/redux-resources/robots'

import type { PipetteOffsetCalibration } from '/app/redux/calibration/types'
import type { State } from '/app/redux/types'
import type { AttachedPipette, Mount } from '/app/redux/pipettes/types'

export function usePipetteOffsetCalibration(
  robotName: string | null = null,
  pipetteId: AttachedPipette['id'] | null = null,
  mount: Mount
): PipetteOffsetCalibration | null {
  const [dispatchRequest] = useDispatchApiRequest()
  const robot = useRobot(robotName)

  const pipetteOffsetCalibration = useSelector((state: State) =>
    getCalibrationForPipette(
      state,
      robotName == null ? '' : robotName,
      pipetteId == null ? '' : pipetteId,
      mount
    )
  )

  useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchPipetteOffsetCalibrations(robotName))
    }
  }, [dispatchRequest, robotName, robot?.status])

  return pipetteOffsetCalibration
}
