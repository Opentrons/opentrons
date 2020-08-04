// @flow
import { createSelector } from 'reselect'
import head from 'lodash/head'
import isEqual from 'lodash/isEqual'
import uniqWith from 'lodash/uniqWith'

import {
  getLabwareDisplayName,
  getModuleDisplayName,
} from '@opentrons/shared-data'

import { selectors as robotSelectors } from '../../robot'
import {
  matchesLabwareIdentity,
  makeBaseProtocolLabware,
  formatCalibrationData,
} from './utils'

import type { State } from '../../types'
import type { LabwareCalibrationModel } from '../types'
import type { LabwareSummary, BaseProtocolLabware } from './types'

export const getLabwareCalibrations = (
  state: State,
  robotName: string
): Array<LabwareCalibrationModel> => {
  return state.calibration[robotName]?.labwareCalibrations?.data ?? []
}

const getBaseLabwareList: (
  state: State,
  robotName: string
) => Array<BaseProtocolLabware> = createSelector(
  (state, robotName) => robotSelectors.getLabware(state),
  (state, robotName) => robotSelectors.getModulesBySlot(state),
  (protocolLabware, modulesBySlot) => {
    return protocolLabware.map(lw => makeBaseProtocolLabware(lw, modulesBySlot))
  }
)

// TODO(mc, 2020-07-27): this selector should move to a protocol-focused module
// when we don't have to rely on RPC-state selectors for protocol equipment info
// NOTE(mc, 2020-07-27): due to how these endpoints work, v1 labware will always
// come back as having "no calibration data". The `legacy` field is here so the
// UI can adjust its messaging accordingly
export const getProtocolLabwareList: (
  state: State,
  robotName: string
) => Array<LabwareSummary> = createSelector(
  getBaseLabwareList,
  getLabwareCalibrations,
  (baseLabwareList, calibrations) => {
    const uniqueLabware = uniqWith<BaseProtocolLabware>(
      baseLabwareList,
      (labwareA, labwareB) => {
        const { definition: _defA, ...labwareIdentityA } = labwareA
        const { definition: _defB, ...labwareIdentityB } = labwareB
        return isEqual(labwareIdentityA, labwareIdentityB)
      }
    )

    return uniqueLabware.map(lw => {
      const { definition: def, loadName, parent } = lw
      const displayName = def ? getLabwareDisplayName(def) : loadName
      const parentDisplayName = parent ? getModuleDisplayName(parent) : null

      const quantity = baseLabwareList.filter(t =>
        matchesLabwareIdentity(t, lw)
      ).length

      const calData = calibrations
        .filter(({ attributes }) => matchesLabwareIdentity(attributes, lw))
        .map(formatCalibrationData)

      return {
        displayName,
        parentDisplayName,
        quantity,
        calibration: head(calData) ?? null,
        legacy: lw.legacy,
      }
    })
  }
)
