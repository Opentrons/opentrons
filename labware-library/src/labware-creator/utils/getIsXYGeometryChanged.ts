import difference from 'lodash/difference'

import { DEFAULTED_DEF_PATCH } from '../getDefaultedDef'

import type { LabwareFields } from '../fields'

/** Fields the side view draws that the top view ignores. */
const SIDE_VIEW_KEYS = [
  'labwareZDimension',
  'wellDepth',
  'wellBottomShape',
  'skirtHeight',
] as const

export const getIsSideViewGeometryChanged = (
  prevValues: LabwareFields | null,
  values: LabwareFields
): boolean => {
  if (prevValues == null) {
    return false
  }
  return SIDE_VIEW_KEYS.some(key => prevValues[key] !== values[key])
}

export const getIsXYGeometryChanged = (
  prevValues: LabwareFields,
  values: LabwareFields
): boolean => {
  // The defaulted def patch is the source of truth for non-xy-geometry fields.
  // If a field is not in that patch, assume it can affect xy geometry.
  const NON_XY_GEOMETRY_KEYS = Object.keys(DEFAULTED_DEF_PATCH)
  const geometryKeys = difference(
    Object.keys(values),
    NON_XY_GEOMETRY_KEYS
  ) as Array<keyof LabwareFields>

  return geometryKeys.some(key => prevValues[key] !== values[key])
}
