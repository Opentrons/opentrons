import { DEFAULT_MIN_PASSWORD_LENGTH } from '/app/resources/auth'

import type { AuthSettingsData } from '@opentrons/api-client'

export const MIN_NUMBER_OF_LOGIN_ATTEMPTS = 1
export const MAX_NUMBER_OF_LOGIN_ATTEMPTS = 5

export const MIN_PASSWORD_RESET_TIME_DAYS = 1
export const MAX_PASSWORD_RESET_TIME_DAYS = 3000

export const MIN_PASSWORD_COMPLEXITY_MINIMUM_LENGTH = 1

export const MIN_IDLE_LOGOUT_MINUTES = 1
export const MAX_IDLE_LOGOUT_MINUTES = 30000000

export const MIN_LENGTH_OF_REASON_FOR_INTERACTION = 1

/** Maximum value of a signed 32-bit C int. */
export const MAX_C_INT = 2147483647

export const DEFAULT_PASSWORD_COMPLEXITY_SETTINGS: AuthSettingsData = {
  passwordComplexitySpecialCharacters: true,
  passwordComplexityMinimumLength: DEFAULT_MIN_PASSWORD_LENGTH,
}

export const DEFAULT_PASSWORD_COMPLEXITY_DISABLED_SETTINGS: AuthSettingsData = {
  passwordComplexitySpecialCharacters: false,
  passwordComplexityMinimumLength: null,
}
