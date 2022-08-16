import React from 'react'
import { useSelector } from 'react-redux'

import {
  fetchCalibrationStatus,
  getDeckCalibrationData,
  DECK_CAL_STATUS_OK,
} from '../../../redux/calibration'
import { useDispatchApiRequest } from '../../../redux/robot-api'
import { useDeckCalibrationStatus } from './'

import type { DeckCalibrationData } from '../../../redux/calibration/types'
import type { State } from '../../../redux/types'

/**
 * Returns deck calibration data and whether deck calibration is done or not
 * @param   {string | null} robotName
 * @returns {DeckCalibrationData | null, boolean}
 *
 */
export function useDeckCalibrationData(
  robotName: string | null = null
): {
  deckCalibrationData: DeckCalibrationData | null
  isDeckCalibrated: boolean
} {
  const [dispatchRequest] = useDispatchApiRequest()

  const deckCalibrationData = useSelector((state: State) =>
    getDeckCalibrationData(state, robotName)
  )
  const deckCalibrationStatus = useDeckCalibrationStatus(robotName)

  const isDeckCalibrated = !(
    deckCalibrationStatus != null &&
    deckCalibrationStatus !== DECK_CAL_STATUS_OK
  )

  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchCalibrationStatus(robotName))
    }
  }, [dispatchRequest, robotName])

  return { deckCalibrationData, isDeckCalibrated }
}
