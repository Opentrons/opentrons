import React from 'react'
import { useSelector } from 'react-redux'

import {
  fetchCalibrationStatus,
  getDeckCalibrationData,
} from '../../../redux/calibration'
import { useDispatchApiRequest } from '../../../redux/robot-api'

import type { DeckCalibrationData } from '../../../redux/calibration/types'
import type { State } from '../../../redux/types'

export function useDeckCalibrationData(
  robotName: string | null = null
): DeckCalibrationData | null {
  const [dispatchRequest] = useDispatchApiRequest()

  const deckCalibrationData = useSelector((state: State) =>
    getDeckCalibrationData(state, robotName)
  )

  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchCalibrationStatus(robotName))
    }
  }, [dispatchRequest, robotName])

  return deckCalibrationData
}
