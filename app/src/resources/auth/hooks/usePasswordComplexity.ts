import { useMemo } from 'react'

import { useAuthSettingsQuery } from '@opentrons/react-api-client'

import { DEFAULT_MIN_PASSWORD_LENGTH } from '../getPasswordComplexityError'

import type { PasswordComplexityRequirements } from '../getPasswordComplexityError'

export function usePasswordComplexity(): {
  passwordComplexity: PasswordComplexityRequirements | null
  isLoading: boolean
} {
  const { data: authSettings, isLoading } = useAuthSettingsQuery()
  const passwordComplexity = useMemo(() => {
    if (authSettings) {
      return {
        minLength:
          authSettings.data.passwordComplexityMinimumLength ??
          DEFAULT_MIN_PASSWORD_LENGTH,
        requireSpecialCharacters:
          authSettings.data.passwordComplexitySpecialCharacters === true,
      }
    }
    return null
  }, [authSettings])

  return { passwordComplexity, isLoading }
}
