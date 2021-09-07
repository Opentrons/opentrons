import difference from 'lodash/difference'
import { LabwareFields } from '../fields'
import { DEFAULTED_DEF_PATCH } from '../getDefaultedDef'

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
