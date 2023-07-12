import head from 'lodash/head'
import {
  useAllPipetteOffsetCalibrationsQuery,
  useAllTipLengthCalibrationsQuery,
} from '@opentrons/react-api-client'
import { useAttachedPipettes } from './useAttachedPipettes'

import type { PipetteCalibrationsByMount } from '../../../redux/pipettes/types'
import type {
  PipetteOffsetCalibration,
  TipLengthCalibration,
} from '@opentrons/api-client'

export function useAttachedPipetteCalibrations(): PipetteCalibrationsByMount {
  const attachedPipettes = useAttachedPipettes()
  const pipetteOffsetCalibrations =
    useAllPipetteOffsetCalibrationsQuery()?.data?.data ?? []
  const tipLengthCalibrations =
    useAllTipLengthCalibrationsQuery()?.data?.data ?? []
  const offsets = {
    left:
      attachedPipettes.left != null
        ? filterCalibrationForPipette(
            pipetteOffsetCalibrations,
            attachedPipettes.left.id,
            'left'
          )
        : null,
    right:
      attachedPipettes.right != null
        ? filterCalibrationForPipette(
            pipetteOffsetCalibrations,
            attachedPipettes.right.id,
            'right'
          )
        : null,
  }

  return {
    left: {
      offset: offsets.left,
      tipLength: filterTipLengthForPipetteAndTiprack(
        tipLengthCalibrations,
        attachedPipettes.left?.id ?? null,
        offsets.left?.tiprack ?? null
      ),
    },
    right: {
      offset: offsets.right,
      tipLength: filterTipLengthForPipetteAndTiprack(
        tipLengthCalibrations,
        attachedPipettes.right?.id ?? null,
        offsets.right?.tiprack ?? null
      ),
    },
  }
}

function filterTipLengthForPipetteAndTiprack(
  allCalibrations: TipLengthCalibration[],
  pipetteSerial: string | null,
  tiprackHash: string | null
): TipLengthCalibration | null {
  return (
    head(
      allCalibrations.filter(
        cal => cal.pipette === pipetteSerial && cal.tiprack === tiprackHash
      )
    ) ?? null
  )
}

function filterCalibrationForPipette(
  calibrations: PipetteOffsetCalibration[],
  pipetteSerial: string,
  mount: string | null
): PipetteOffsetCalibration | null {
  return (
    head(
      calibrations.filter(
        cal => cal.pipette === pipetteSerial && cal.mount === mount
      )
    ) ?? null
  )
}
