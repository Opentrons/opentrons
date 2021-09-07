import { getIsHidden } from '../formSelectors'
import { LabwareFields } from '../fields'

export const isEveryFieldHidden = (
  fieldList: Array<keyof LabwareFields>,
  values: LabwareFields
): boolean => {
  const numFieldsHidden = fieldList
    .map(field => getIsHidden(field, values))
    .filter(Boolean).length

  return numFieldsHidden === fieldList.length
}
