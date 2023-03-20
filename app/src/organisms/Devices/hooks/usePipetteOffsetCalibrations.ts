import { useAllPipetteOffsetCalibrationsQuery } from '@opentrons/react-api-client'

import type { PipetteOffsetCalibration } from '../../../redux/calibration/types'

const CALIBRATION_DATA_POLL_MS = 5000

export function usePipetteOffsetCalibrations():
  | PipetteOffsetCalibration[]
  | null {
  const pipetteOffsetCalibrations =
    useAllPipetteOffsetCalibrationsQuery({
      refetchInterval: CALIBRATION_DATA_POLL_MS,
    })?.data?.data ?? []

  return pipetteOffsetCalibrations
}
