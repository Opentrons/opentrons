import { useCalibrationStatusQuery } from '@opentrons/react-api-client'
import { useRobot } from '/app/redux-resources/robots'
import type { DeckCalibrationStatus } from '/app/redux/calibration/types'

export function useDeckCalibrationStatus(
  robotName: string | null = null
): DeckCalibrationStatus | null {
  const robot = useRobot(robotName)
  return (
    useCalibrationStatusQuery(
      {},
      robot?.ip != null ? { hostname: robot.ip } : null
    )?.data?.deckCalibration?.status ?? null
  )
}
