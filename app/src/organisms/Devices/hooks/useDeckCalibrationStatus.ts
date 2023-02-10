import { useCalibrationStatusQuery } from '@opentrons/react-api-client'
import { useRobot } from './useRobot'
import type { DeckCalibrationStatus } from '../../../redux/calibration/types'

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
