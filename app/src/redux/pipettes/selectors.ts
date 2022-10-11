import { createSelector } from 'reselect'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import {
  getPipetteOffsetCalibrations,
  filterCalibrationForPipette,
} from '../calibration/pipette-offset'
import {
  getTipLengthCalibrations,
  filterTipLengthForPipetteAndTiprack,
} from '../calibration/tip-length'

import * as Constants from './constants'
import * as Types from './types'

import type { PipetteModel } from '@opentrons/shared-data'
import type { State } from '../types'

export const getAttachedPipettes: (
  state: State,
  robotName: string | null
) => Types.AttachedPipettesByMount = createSelector(
  (state: State, robotName: string | null) =>
    robotName ? state?.pipettes[robotName]?.attachedByMount : null,
  attachedByMount => {
    return Constants.PIPETTE_MOUNTS.reduce<Types.AttachedPipettesByMount>(
      (result, mount) => {
        const attached = attachedByMount?.[mount] || null
        const modelSpecs =
          attached && attached.model
            ? getPipetteModelSpecs(attached.model as PipetteModel)
            : null

        if (attached && attached.model && modelSpecs) {
          result[mount] = { ...attached, modelSpecs }
        }

        return result
      },
      { left: null, right: null }
    )
  }
)

export const getAttachedPipetteSettingsFieldsById = (
  state: State,
  robotName: string,
  pipetteId: string
): Types.PipetteSettingsFieldsMap | null =>
  state?.pipettes?.[robotName]?.settingsById?.[pipetteId]?.fields ?? null

export const getAttachedPipetteCalibrations: (
  state: State,
  robotName: string | null
) => Types.PipetteCalibrationsByMount = createSelector(
  getAttachedPipettes,
  getPipetteOffsetCalibrations,
  getTipLengthCalibrations,
  (attached, calibrations, tipLengths) => {
    console.log('RESELECT CALS')
    const offsets = {
      left: attached.left
        ? filterCalibrationForPipette(calibrations, attached.left.id, 'left')
        : null,
      right: attached.right
        ? filterCalibrationForPipette(calibrations, attached.right.id, 'right')
        : null,
    }
    return {
      left: {
        offset: offsets.left,
        tipLength: filterTipLengthForPipetteAndTiprack(
          tipLengths,
          attached.left?.id ?? null,
          offsets.left?.tiprack ?? null
        ),
      },
      right: {
        offset: offsets.right,
        tipLength: filterTipLengthForPipetteAndTiprack(
          tipLengths,
          attached.right?.id ?? null,
          offsets.right?.tiprack ?? null
        ),
      },
    }
  }
)
