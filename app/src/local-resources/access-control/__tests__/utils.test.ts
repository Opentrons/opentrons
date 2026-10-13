import { describe, expect, it } from 'vitest'

import {
  getProtocolOrRunCreationErrorMessage,
  isAdminEquivalentAccountType,
  isForbiddenError,
  isInsufficientScopeError,
  isRunSignoffRequiredError,
  isUpdatesWritePermissionError,
} from '../utils'

const GENERAL_ERROR = 'Protocol run could not be created on the robot.'

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

describe('isInsufficientScopeError', () => {
  it('is true for a 403 with requiredScopes', () => {
    expect(isInsufficientScopeError(permissionDeniedError)).toBe(true)
  })

  it('is false for a 403 without requiredScopes', () => {
    expect(
      isInsufficientScopeError({
        isAxiosError: true,
        response: {
          status: 403,
          data: { errors: [{ id: 'ActionForbidden' }] },
        },
      })
    ).toBe(false)
  })

  it('is false for a non-403 with requiredScopes', () => {
    expect(
      isInsufficientScopeError({
        isAxiosError: true,
        response: { status: 401, data: { requiredScopes: [] } },
      })
    ).toBe(false)
  })

  it('is false for non-axios errors', () => {
    expect(isInsufficientScopeError(new Error('nope'))).toBe(false)
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

const updatesWriteDeniedError = {
  isAxiosError: true,
  response: {
    status: 403,
    data: {
      debugMessage: 'missing scopes',
      requiredScopes: ['updates.write'],
      providedScopes: ['users.read.self', 'users.write.self'],
    },
  },
}

describe('isUpdatesWritePermissionError', () => {
  it('is true for a 403 missing updates.write', () => {
    expect(isUpdatesWritePermissionError(updatesWriteDeniedError)).toBe(true)
  })

  it('is false for a protocols.write 403', () => {
    expect(isUpdatesWritePermissionError(permissionDeniedError)).toBe(false)
  })

  it('is false for other 403s', () => {
    expect(
      isUpdatesWritePermissionError({
        isAxiosError: true,
        response: {
          status: 403,
          data: { requiredScopes: ['robot.settings.write'] },
        },
      })
    ).toBe(false)
  })

  it('is false for non-axios errors', () => {
    expect(isUpdatesWritePermissionError(new Error('nope'))).toBe(false)
  })
})

describe('getProtocolOrRunCreationErrorMessage', () => {
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
        GENERAL_ERROR
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
        GENERAL_ERROR
      )
    ).toBe(GENERAL_ERROR)
  })

  it('returns the general message for a non-axios error', () => {
    expect(
      getProtocolOrRunCreationErrorMessage(new Error('boom'), GENERAL_ERROR)
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
