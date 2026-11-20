import { MAX_PASSWORD_COMPLEXITY_MINIMUM_LENGTH } from './constants'

import type { AuthSettingsData } from '@opentrons/api-client'

export const USERNAME_MAX_LENGTH = 20

export type PasswordComplexitySettings = Pick<
  AuthSettingsData,
  'passwordComplexityMinimumLength' | 'passwordComplexitySpecialCharacters'
>

export function isValidPasswordComplexityMinimumLength(value: string): boolean {
  const parsedValue = Number(value)
  return (
    Number.isInteger(parsedValue) &&
    parsedValue > 0 &&
    parsedValue <= MAX_PASSWORD_COMPLEXITY_MINIMUM_LENGTH
  )
}

export function settingsAreEqual(
  oldSettings: PasswordComplexitySettings,
  newSettings: PasswordComplexitySettings
): boolean {
  return (
    oldSettings.passwordComplexityMinimumLength ===
      newSettings.passwordComplexityMinimumLength &&
    oldSettings.passwordComplexitySpecialCharacters ===
      newSettings.passwordComplexitySpecialCharacters
  )
}

export function hasPasswordComplexityIncreased(
  oldSettings: PasswordComplexitySettings,
  newSettings: PasswordComplexitySettings
): boolean {
  const settingsEqual = settingsAreEqual(oldSettings, newSettings)
  const newSettingsEnabled =
    (!oldSettings.passwordComplexityMinimumLength &&
      !!newSettings.passwordComplexityMinimumLength) ||
    (!oldSettings.passwordComplexitySpecialCharacters &&
      !!newSettings.passwordComplexitySpecialCharacters)
  const lengthIncreased =
    (oldSettings.passwordComplexityMinimumLength ?? 0) <
    (newSettings.passwordComplexityMinimumLength ?? 0)
  return !settingsEqual && (newSettingsEnabled || lengthIncreased)
}
