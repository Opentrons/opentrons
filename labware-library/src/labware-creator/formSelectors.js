// @flow
import {
  aluminumBlockAutofills,
  getImplicitAutofillValues,
  tubeRackAutofills,
  type LabwareFields,
} from './fields'

// TODO(Ian, 2019-07-24): consolidate `tubeRackAutofills/aluminumBlockAutofills`-getting logic btw here and makeAutofillOnChange
export const getIsAutofilled = (
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
