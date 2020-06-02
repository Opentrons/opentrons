// @flow
import { THERMOCYCLER_PROFILE } from '../../constants'
import type { Node } from 'react'

// TODO: real HydratedFormData type
type HydratedFormData = any

export type ProfileFormError = {
  title: string,
  body?: Node,
  dependentProfileFields: Array<string>,
}

type ProfileFormErrorKey = 'INVALID_PROFILE_DURATION'

const PROFILE_FORM_ERRORS: { [ProfileFormErrorKey]: ProfileFormError } = {
  INVALID_PROFILE_DURATION: {
    title: 'Invalid profile duration', // TODO IMMEDIATELY: what is the actual copy?
    dependentProfileFields: ['durationMinutes', 'durationSeconds'],
  },
}

// TC Profile multi-field error fns

export const profileItemsValidDuration = (
  fields: HydratedFormData
): ProfileFormError | null => {
  const { thermocyclerFormType, orderedProfileItems, profileItemsById } = fields
  if (thermocyclerFormType === THERMOCYCLER_PROFILE) {
    const someErrors = orderedProfileItems.some(itemId => {
      const item = profileItemsById[itemId]
      const minutes = parseFloat(item.durationMinutes) || 0
      const seconds = parseFloat(item.durationSeconds) || 0
      const isValid = minutes > 0 || seconds > 0
      return !isValid
    })
    if (someErrors) {
      return PROFILE_FORM_ERRORS.INVALID_PROFILE_DURATION
    }
  }
  return null
}

// =====

const ALL_PROFILE_ERROR_GETTERS = [profileItemsValidDuration]

export const getProfileFormErrors = (
  hydratedForm: HydratedFormData
): Array<ProfileFormError> => {
  return ALL_PROFILE_ERROR_GETTERS.reduce<Array<ProfileFormError>>(
    (acc, errorGetter) => {
      const nextErrors = errorGetter(hydratedForm)
      return nextErrors === null ? acc : [...acc, nextErrors]
    },
    []
  )
}
