import { useAllTipLengthCalibrationsQuery } from '@opentrons/react-api-client'

import type { TipLengthCalibration } from '../../../redux/calibration/types'

const CALIBRATIONS_FETCH_MS = 5000

export function useTipLengthCalibrations(): TipLengthCalibration[] | null {
  const tipLengthCalibrations =
    useAllTipLengthCalibrationsQuery({
      refetchInterval: CALIBRATIONS_FETCH_MS,
    })?.data?.data ?? []
  return tipLengthCalibrations
}
