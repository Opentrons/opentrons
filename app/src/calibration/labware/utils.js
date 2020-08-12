// @flow

import round from 'lodash/round'
import assert from 'assert'
import type { LabwareCalibrationModel, LabwareCalibration } from '../types'
import type { LabwareCalibrationData, BaseProtocolLabware } from './types'

const normalizeParent = parent =>
  // internal protocol labware model uses null for no parent
  // API calibration model uses empty string for no parent
  // normalize to null to do the comparison
  parent === '' || parent === null ? null : parent

// checks for labware identity match according to labware
// loadName, namespace, and version attributes
// NOTE: this may match labware with different
// defintion hashes
export const matchesLabwareIdentityForQuantity = (
  target: BaseProtocolLabware,
  compare: BaseProtocolLabware
): boolean => {
  return (
    target.loadName === compare.loadName &&
    target.namespace === compare.namespace &&
    target.version === compare.version &&
    normalizeParent(target.parent) === normalizeParent(compare.parent)
  )
}

// checks for labware identity match according to labware
// definition hashes, in order to capture true identity
// and match robot-side matching algorithm
// this is mostly for backwards compatibility concerns
export const matchesLabwareIdentityForCalibration = (
  target: LabwareCalibration,
  compare: BaseProtocolLabware
): boolean => {
  // NOTE: should never be called on labware that doesn't have the definitionHash key
  return (
    target.definitionHash === compare.definitionHash &&
    normalizeParent(target.parent) === normalizeParent(compare.parent)
  )
}

export function formatCalibrationData(
  model: LabwareCalibrationModel
): LabwareCalibrationData {
  const calVector = model.attributes.calibrationData.offset.value.map(n =>
    round(n, 1)
  )
  return { x: calVector[0], y: calVector[1], z: calVector[2] }
}
