import React from 'react'
import { useSelector } from 'react-redux'

import {
  fetchPipetteOffsetCalibrations,
  getCalibrationForPipette,
} from '../../../redux/calibration'
import { useDispatchApiRequest } from '../../../redux/robot-api'
import { useRobot } from '.'

import type { PipetteOffsetCalibration } from '../../../redux/calibration/types'
import type { State } from '../../../redux/types'
import type { AttachedPipette, Mount } from '../../../redux/pipettes/types'

export function usePipetteOffsetCalibration(
  robotName: string | null = null,
  pipetteId: AttachedPipette['id'] | null = null,
  mount: Mount | null = null
): PipetteOffsetCalibration | null {
  const [dispatchRequest] = useDispatchApiRequest()

  const robot = useRobot(robotName)

  const pipetteOffsetCalibration =
    robotName === null || pipetteId === null || mount === null
      ? null
      : useSelector((state: State) =>
          getCalibrationForPipette(state, robotName, pipetteId, mount)
        )

  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchPipetteOffsetCalibrations(robotName))
    }
  }, [dispatchRequest, robotName, robot?.status])

  return pipetteOffsetCalibration
}
