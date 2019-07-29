// @flow
import {
  aluminumBlockAutofills,
  getImplicitAutofillValues,
  tubeRackAutofills,
  type LabwareFields,
} from './fields'

// TODO(Ian, 2019-07-24): consolidate `tubeRackAutofills/aluminumBlockAutofills`-getting logic btw here and makeAutofillOnChange
export const _getIsAutofilled = (
  name: $Keys<LabwareFields>,
  values: LabwareFields
): boolean => {
  const { labwareType, aluminumBlockType, tubeRackInsertLoadName } = values
  const isAutofilledByDefault = Object.keys(
    getImplicitAutofillValues(values)
  ).includes(name)

  if (labwareType === 'aluminumBlock' && aluminumBlockType != null) {
    return (
      isAutofilledByDefault ||
      Object.keys(aluminumBlockAutofills[aluminumBlockType] || {}).includes(
        name
      )
    )
  } else if (labwareType === 'tubeRack' && tubeRackInsertLoadName != null) {
    return (
      isAutofilledByDefault ||
      Object.keys(tubeRackAutofills[tubeRackInsertLoadName] || {}).includes(
        name
      )
    )
  }
  return false
}

// any fields that are conditionally defaulted by the Yup schema and do not need to be displayed.
export const _getIsDefaulted = (
  name: $Keys<LabwareFields>,
  values: LabwareFields
): boolean => {
  if (name === 'gridSpacingX' && Number(values.gridColumns) === 1) {
    return true
  }
  if (name === 'gridSpacingY' && Number(values.gridRows) === 1) {
    return true
  }
  return false
}

// a field should be hidden when it is autofilled or is defaulted
export const getIsHidden = (
  name: $Keys<LabwareFields>,
  values: LabwareFields
) => _getIsAutofilled(name, values) || _getIsDefaulted(name, values)
