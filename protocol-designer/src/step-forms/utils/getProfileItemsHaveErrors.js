// @flow
import { getProfileFieldErrors } from '../../steplist/fieldLevel'
import { PROFILE_CYCLE } from '../../form-types'
import type { ProfileItem } from '../../form-types'

const _someFieldsHaveErrors = (item: ProfileItem): boolean => {
  for (const fieldName in item) {
    const value = item[fieldName]
    const fieldErrors = getProfileFieldErrors(fieldName, value)

    if (fieldErrors.length > 0) {
      return true
    }
  }
  return false
}

export const getProfileItemsHaveErrors = (profileItems: {
  [id: string]: ProfileItem,
}): boolean => {
  // TODO: fieldName includes id, stepType, etc... this is weird #3161

  for (const itemId in profileItems) {
    const item = profileItems[itemId]

    if (_someFieldsHaveErrors(item)) {
      return true
    }

    if (item.type === PROFILE_CYCLE) {
      // we already checked the cycle's own field (eg 'repetitions' field) above
      // but we need to check its steps
      for (const step of item.steps) {
        if (_someFieldsHaveErrors(step)) {
          return true
        }
      }
    }
  }
  return false
}
