// @flow

import round from 'lodash/round'
import type { Labware, Slot, SessionModule } from '../../robot/types'
import type { LabwareCalibrationModel } from '../types'
import type { LabwareCalibrationData } from './types'
import { getLabwareCalibrations } from './selectors'

type LabwareIdentity = {|
  loadName: string,
  namespace: string | null,
  version: number | null,
|}

export function getLabwareIdentityParams(labware: Labware): LabwareIdentity {
  const { definition } = labware
  const loadName = definition?.parameters.loadName ?? labware.type
  const namespace = definition?.namespace ?? null
  const version = definition?.version ?? null
  return { loadName, namespace, version }
}

export function doesLabwareIdentityMatch(
  compareCalbration: LabwareCalibrationModel,
  targetLabware: Labware,
  modulesBySlot: { [Slot]: SessionModule }
): boolean {
  const { loadName, namespace, version, parent } = compareCalbration.attributes
  const {
    loadName: targetLoadName,
    namespace: targetNamespace,
    version: targetVersion,
  } = getLabwareIdentityParams(targetLabware)
  const targetParent = modulesBySlot[targetLabware.slot]?.model ?? null

  return (
    loadName === targetLoadName &&
    namespace === targetNamespace &&
    version === targetVersion &&
    (targetParent === null || parent === targetParent)
  )
}

export function getCalibrationDataForLabware(
  calibrations: Array<LabwareCalibrationModel>,
  targetLabware: Labware,
  modulesBySlot: { [Slot]: SessionModule } = {}
): Array<LabwareCalibrationData> {
  return calibrations
    .filter((compareCalbration: LabwareCalibrationModel) =>
      doesLabwareIdentityMatch(compareCalbration, targetLabware, modulesBySlot)
    )
    .map(({ attributes }) => {
      console.log('through filter: ', attributes)
      const calVector = attributes.calibrationData.offset.value.map(n =>
        round(n, 1)
      )
      return { x: calVector[0], y: calVector[1], z: calVector[2] }
    })
}
