import { describe, expect, it } from 'vitest'

import {
  mapAuthUserMutationError,
  mapSetNewPasswordError,
} from '../mapAuthUserMutationError'

import type { TFunction } from 'i18next'

const t = ((key: string) => key) as TFunction

function axiosError(errors: Array<{ id: string; meta?: object }>): unknown {
  return {
    isAxiosError: true,
    response: {
      data: { errors },
    },
  }
}

describe('mapAuthUserMutationError', () => {
  it('prefers passwordTooShort when special-character and length errors are both present', () => {
    const result = mapAuthUserMutationError<{ password: string }>(
      axiosError([
        { id: 'passwordMissingSpecialCharacters' },
        { id: 'passwordTooShort', meta: { requiredLength: 12 } },
      ]),
      t
    )

    expect(result).toEqual({
      field: 'password',
      error: {
        type: 'server',
        message: 'desktop_password_too_short',
      },
    })
  })
})

describe('mapSetNewPasswordError', () => {
  it('maps a too-short password to the descriptive length message', () => {
    expect(
      mapSetNewPasswordError(
        axiosError([{ id: 'passwordTooShort', meta: { requiredLength: 8 } }]),
        t
      )
    ).toBe('must_be_at_least_characters')
  })

  it('maps a missing special character to the descriptive special-character message', () => {
    expect(
      mapSetNewPasswordError(
        axiosError([{ id: 'passwordMissingSpecialCharacters' }]),
        t
      )
    ).toBe('must_include_at_least_one_special_character')
  })

  it('prefers the length message when both password policy errors are present', () => {
    expect(
      mapSetNewPasswordError(
        axiosError([
          { id: 'passwordMissingSpecialCharacters' },
          { id: 'passwordTooShort', meta: { requiredLength: 10 } },
        ]),
        t
      )
    ).toBe('must_be_at_least_characters')
  })

  it('falls back to the generic update-failed message for unknown errors', () => {
    expect(mapSetNewPasswordError(new Error('network'), t)).toBe(
      'set_new_password_error_update_failed'
    )
  })
})
