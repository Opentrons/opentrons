// @flow
import { getProfileFieldErrors } from '../../steplist/fieldLevel'
import type { ProfileItem } from '../../form-types'

export const getProfileItemsHaveErrors = (profileItems: {
  [id: string]: ProfileItem,
}): boolean => {
  // TODO: fieldName includes id, stepType, etc... this is weird #3161
  for (const itemId in profileItems) {
    const item = profileItems[itemId]
    for (const fieldName in item) {
      const value = item[fieldName]
      const fieldErrors = getProfileFieldErrors(fieldName, value)

      if (fieldErrors.length > 0) {
        return true
      }
    }
  }
  return false
}
