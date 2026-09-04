import { describe, expect, it } from 'vitest'

import {
  getAuditLogDeleteErrorMessage,
  getProtocolOrRunCreationErrorMessage,
  isAdminEquivalentAccountType,
  isForbiddenError,
  isProtocolWritePermissionError,
  isRunSignoffRequiredError,
} from '../utils'

const GENERAL_ERROR = 'Protocol run could not be created on the robot.'
const PERMISSION_ERROR =
  'Admin credentials are required to send protocols to this robot.'

const permissionDeniedError = {
  isAxiosError: true,
  response: {
    status: 403,
    data: {
      debugMessage: 'missing scopes',
      requiredScopes: ['protocols.write'],
      providedScopes: ['users.read.self', 'users.write.self'],
    },
  },
}

describe('isForbiddenError', () => {
  it('is true for a 403 axios error', () => {
    expect(isForbiddenError(permissionDeniedError)).toBe(true)
  })

  it('is false for a non-403 axios error', () => {
    expect(
      isForbiddenError({
        isAxiosError: true,
        response: { status: 500 },
      })
    ).toBe(false)
  })

  it('is false for a non-axios error', () => {
    expect(
      isForbiddenError(new Error('One or more logPeriods failed to delete'))
    ).toBe(false)
  })

  it('is false for a null error', () => {
    expect(isForbiddenError(null)).toBe(false)
  })
})

describe('getAuditLogDeleteErrorMessage', () => {
  const permissionMessage =
    'Permission required to delete audit logs. Log in with an authorized account.'
  const generalMessage = 'One or more logPeriods failed to delete'

  it('returns the permission copy for a 403', () => {
    expect(
      getAuditLogDeleteErrorMessage(
        permissionDeniedError,
        permissionMessage,
        generalMessage
      )
    ).toBe(permissionMessage)
  })

  it('returns the general copy for other errors', () => {
    expect(
      getAuditLogDeleteErrorMessage(
        new Error(generalMessage),
        permissionMessage,
        generalMessage
      )
    ).toBe(generalMessage)
  })
})

describe('isRunSignoffRequiredError', () => {
  it('is true when the API error id is RunSignoffRequired', () => {
    expect(
      isRunSignoffRequiredError({
        isAxiosError: true,
        response: {
          data: {
            errors: [{ id: 'RunSignoffRequired' }],
          },
        },
      })
    ).toBe(true)
  })

  it('is false for a different API error id', () => {
    expect(
      isRunSignoffRequiredError({
        isAxiosError: true,
        response: {
          data: {
            errors: [{ id: 'RunNotIdle' }],
          },
        },
      })
    ).toBe(false)
  })

  it('is false for a generic Error', () => {
    expect(
      isRunSignoffRequiredError(new Error('One or more runs failed to delete'))
    ).toBe(false)
  })
})

describe('isProtocolWritePermissionError', () => {
  it('is true for a 403 missing protocols.write', () => {
    expect(isProtocolWritePermissionError(permissionDeniedError)).toBe(true)
  })

  it('is false for other 403s', () => {
    expect(
      isProtocolWritePermissionError({
        isAxiosError: true,
        response: {
          status: 403,
          data: { requiredScopes: ['robot.settings.write'] },
        },
      })
    ).toBe(false)
  })

  it('is false for non-axios errors', () => {
    expect(isProtocolWritePermissionError(new Error('nope'))).toBe(false)
  })
})

describe('getProtocolOrRunCreationErrorMessage', () => {
  it('returns the permission copy for a protocols.write 403', () => {
    expect(
      getProtocolOrRunCreationErrorMessage(
        permissionDeniedError,
        GENERAL_ERROR,
        PERMISSION_ERROR
      )
    ).toBe(PERMISSION_ERROR)
  })

  it('returns JSON API error detail when present', () => {
    expect(
      getProtocolOrRunCreationErrorMessage(
        {
          isAxiosError: true,
          response: {
            status: 400,
            data: {
              errors: [{ id: 'BadRequest', title: 'Bad', detail: 'oh no' }],
            },
          },
        },
        GENERAL_ERROR,
        PERMISSION_ERROR
      )
    ).toBe('oh no')
  })

  it('returns the general message when the 403 body is an object without JSON API errors', () => {
    expect(
      getProtocolOrRunCreationErrorMessage(
        {
          isAxiosError: true,
          response: {
            status: 403,
            data: {
              debugMessage: 'missing scopes',
              requiredScopes: ['updates.write'],
              providedScopes: [],
            },
          },
        },
        GENERAL_ERROR,
        PERMISSION_ERROR
      )
    ).toBe(GENERAL_ERROR)
  })

  it('returns the general message for a non-axios error', () => {
    expect(
      getProtocolOrRunCreationErrorMessage(
        new Error('boom'),
        GENERAL_ERROR,
        PERMISSION_ERROR
      )
    ).toBe(GENERAL_ERROR)
  })
})

describe('isAdminEquivalentAccountType', () => {
  it('returns true for admin and service accounts', () => {
    expect(isAdminEquivalentAccountType('admin')).toBe(true)
    expect(isAdminEquivalentAccountType('service')).toBe(true)
  })

  it('returns false for other account types and missing values', () => {
    expect(isAdminEquivalentAccountType('user')).toBe(false)
    expect(isAdminEquivalentAccountType('auditor')).toBe(false)
    expect(isAdminEquivalentAccountType(undefined)).toBe(false)
  })
})
