import {
  DECK_CAL_STATUS_OK,
  DECK_CAL_STATUS_BAD_CALIBRATION,
} from '/app/redux/calibration'

import { useCalibrationStatusQuery } from '@opentrons/react-api-client'
import { useRobot } from '/app/redux-resources/robots'
import type { DeckCalibrationData } from '@opentrons/api-client'

/**
 * Returns deck calibration data, whether deck calibration is done or not,
 * and whether it was marked bad by calibration health check
 * @param   {string | null} robotName
 * @returns {DeckCalibrationData | null, boolean, boolean}
 *
 */
export function useDeckCalibrationData(
  robotName: string | null = null
): {
  deckCalibrationData: DeckCalibrationData | null
  isDeckCalibrated: boolean
  markedBad?: boolean
} {
  const robot = useRobot(robotName)

  const { data: deckCalibrationData = null, status: deckCalibrationStatus } =
    useCalibrationStatusQuery(
      {},
      robot?.ip != null ? { hostname: robot.ip } : null
    )?.data?.deckCalibration ?? {}

  const isDeckCalibrated =
    deckCalibrationStatus != null &&
    deckCalibrationStatus === DECK_CAL_STATUS_OK

  const markedBad =
    deckCalibrationStatus != null &&
    deckCalibrationStatus === DECK_CAL_STATUS_BAD_CALIBRATION

  return { deckCalibrationData, isDeckCalibrated, markedBad }
}
