import React from 'react'
import { useSelector } from 'react-redux'

import {
  fetchCalibrationStatus,
  getDeckCalibrationStatus,
} from '../../../redux/calibration'
import { useDispatchApiRequest } from '../../../redux/robot-api'

import type { DeckCalibrationStatus } from '../../../redux/calibration/types'
import type { State } from '../../../redux/types'

export function useDeckCalibrationStatus(
  robotName: string | null = null
): DeckCalibrationStatus | null {
  const [dispatchRequest] = useDispatchApiRequest()

  const deckCalibrationStatus = useSelector((state: State) =>
    getDeckCalibrationStatus(state, robotName)
  )

  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchCalibrationStatus(robotName))
    }
  }, [dispatchRequest, robotName])

  return deckCalibrationStatus
}
