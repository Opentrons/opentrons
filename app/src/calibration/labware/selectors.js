// @flow
import { createSelector } from 'reselect'
import head from 'lodash/head'
import isEqual from 'lodash/isEqual'
import round from 'lodash/round'
import uniqWith from 'lodash/uniqWith'

import {
  getLabwareDisplayName,
  getModuleDisplayName,
} from '@opentrons/shared-data'

import { selectors as robotSelectors } from '../../robot'

import type { LabwareDefinition2, ModuleModel } from '@opentrons/shared-data'
import type { State } from '../../types'
import type { LabwareCalibrationModel } from './../types'
import type { LabwareSummary } from './types'

export const getLabwareCalibrations = (
  state: State,
  robotName: string
): Array<LabwareCalibrationModel> => {
  return state.calibration[robotName]?.labwareCalibrations?.data ?? []
}

type BaseProtocolLabware = {|
  definition: LabwareDefinition2 | null,
  loadName: string,
  namespace: string | null,
  version: number | null,
  parent: ModuleModel | null,
  legacy: boolean,
|}

// TODO(mc, 2020-07-27): this selector should move to a protocol-focused module
// when we don't have to rely on RPC-state selectors for protocol equipment info
// NOTE(mc, 2020-07-27): due to how these endpo
export const getProtocolLabwareList: (
  state: State,
  robotName: string
) => Array<LabwareSummary> = createSelector(
  (state, robotName) => robotSelectors.getLabware(state),
  (state, robotName) => robotSelectors.getModulesBySlot(state),
  getLabwareCalibrations,
  (protocolLabware, modulesBySlot, calibrations) => {
    const baseLabwareList: $ReadOnlyArray<BaseProtocolLabware> = protocolLabware.map(
      lw => ({
        definition: lw.definition,
        loadName: lw.definition?.parameters.loadName ?? lw.type,
        namespace: lw.definition?.namespace ?? null,
        version: lw.definition?.version ?? null,
        parent: modulesBySlot[lw.slot]?.model ?? null,
        legacy: lw.isLegacy,
      })
    )

    const uniqueLabware = uniqWith<BaseProtocolLabware>(
      baseLabwareList,
      (labwareA, labwareB) => {
        const { definition: _defA, ...labwareIdentityA } = labwareA
        const { definition: _defB, ...labwareIdentityB } = labwareB
        return isEqual(labwareIdentityA, labwareIdentityB)
      }
    )

    return uniqueLabware.map(lw => {
      const { definition: def, loadName, namespace, version, parent } = lw
      const displayName = def ? getLabwareDisplayName(def) : loadName
      const parentDisplayName = parent ? getModuleDisplayName(parent) : null

      const quantity = baseLabwareList.filter(baseLw => {
        return (
          baseLw.loadName === loadName &&
          baseLw.namespace === namespace &&
          baseLw.version === version
        )
      }).length

      const calData = calibrations
        .filter(({ attributes }) => {
          return (
            attributes.loadName === loadName &&
            attributes.namespace === namespace &&
            attributes.version === version &&
            (!parent || attributes.parent === parent)
          )
        })
        .map(({ attributes }) => {
          const calVector = attributes.calibrationData.offset.value
          return {
            x: round(calVector[0], 1),
            y: round(calVector[1], 1),
            z: round(calVector[2], 1),
          }
        })

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
