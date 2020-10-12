// @flow
import { head } from 'lodash'
import { createSelector } from 'reselect'

import { getProtocolPipettesInfo } from '../../pipettes/selectors'
import { getTipracksByMount } from '../../robot/selectors'
import { PIPETTE_MOUNTS } from  '../../robot/constants'

import type { State } from '../../types'
import type { TipLengthCalibration } from '../api-types'
import type { TipracksByMountMap } from '../../robot/types'

export const getTipLengthCalibrations: (
  state: State,
  robotName: string | null
) => Array<TipLengthCalibration> = (state, robotName) => {
  if (!robotName) {
    return []
  }
  const calibrations =
    state.calibration[robotName]?.tipLengthCalibrations?.data || []
  return calibrations.map(calibration => calibration.attributes)
}

export const getTipLengthForPipetteAndTiprack: (
  state: State,
  robotName: string,
  pipetteSerial: string,
  tiprackHash: string
) => TipLengthCalibration | null = (
  state,
  robotName,
  pipetteSerial,
  tiprackHash
) => {
  const allCalibrations = getTipLengthCalibrations(state, robotName)
  return (
    head(
      allCalibrations.filter(
        cal => cal.pipette === pipetteSerial && cal.tiprack === tiprackHash
      )
    ) || null
  )
}

export const tipLengthExistsForPipetteAndTiprack: (
  calibrations: Array<TipLengthCalibration>,
  pipetteSerial: string,
  tiprackHash: string
) => boolean = (calibrations, pipetteSerial, tiprackHash) => {
  const calibration = head(
    calibrations.filter(
      cal => cal.pipette === pipetteSerial && cal.tiprack === tiprackHash
    )
  )
  return !!calibration
}

export const getUncalibratedTipracksByMount: (
  state: State,
  robotName: string
) => TipracksByMountMap = createSelector(
  getProtocolPipettesInfo,
  getTipLengthCalibrations,
  getTipracksByMount,
  (infoByMount, calibrations, tipracksByMount) => {
    return PIPETTE_MOUNTS.reduce<TipracksByMountMap>(
      (result, mount) => {
        const pip = infoByMount?.[mount]
        const pipetteSerial = pip?.actual?.id
        const tipracks = tipracksByMount?.[mount]
        result[mount] =
          Array.isArray(tipracks) && tipracks?.length && pipetteSerial
            ? tipracks.filter(
                tr =>
                  tr.definitionHash &&
                  !tipLengthExistsForPipetteAndTiprack(
                    calibrations,
                    pipetteSerial,
                    tr.definitionHash
                  )
              )
            : []
        return result
      },
      { left: [], right: [] }
    )
  }
)
