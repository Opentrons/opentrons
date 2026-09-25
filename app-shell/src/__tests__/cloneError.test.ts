import axios from 'axios'
import { describe, expect, it } from 'vitest'

import { cloneError } from '../cloneError'

interface AxiosShapedError extends Error {
  isAxiosError: true
  code?: string
  config: Record<string, unknown>
  response: {
    status: number
    statusText: string
    data: unknown
  }
  toJSON: () => Record<string, unknown>
}

function makeAxiosError(data: unknown, status = 400): AxiosShapedError {
  const error = new Error(
    `Request failed with status code ${status}`
  ) as AxiosShapedError
  error.isAxiosError = true
  error.config = { url: '/auth/oauth2/token' }
  error.response = {
    status,
    statusText: 'Bad Request',
    data,
  }
  // Match axios 0.21 enhanceError.toJSON(), which omits response and isAxiosError.
  error.toJSON = function toJSON() {
    return {
      message: this.message,
      name: this.name,
      stack: this.stack,
      config: this.config,
      code: this.code,
    }
  }
  return error
}

describe('cloneError', () => {
  it('preserves invalid_grant login attempts remaining', () => {
    const data = {
      error: 'invalid_grant',
      opentrons_login_attempts_remaining: 2,
    }
    const error = makeAxiosError(data)

    expect(error.toJSON()).not.toHaveProperty('response')
    expect(error.toJSON()).not.toHaveProperty('isAxiosError')

    const cloned = cloneError(error)

    expect(axios.isAxiosError(cloned)).toBe(true)
    expect(cloned.response).toEqual({
      status: 400,
      statusText: 'Bad Request',
      data,
    })
  })

  it('preserves invalid_grant lockout payload', () => {
    const data = {
      error: 'invalid_grant',
      opentrons_login_attempts_remaining: 0,
      opentrons_account_locked: true,
    }
    const cloned = cloneError(makeAxiosError(data))

    expect(axios.isAxiosError(cloned)).toBe(true)
    expect(cloned.response).toEqual({
      status: 400,
      statusText: 'Bad Request',
      data,
    })
  })

  it('clones message from a non-Axios Error', () => {
    const cloned = cloneError(new Error('boom'))

    expect(cloned.message).toBe('boom')
    expect(cloned.isAxiosError).toBeUndefined()
  })

  it('does not throw when response.data cannot be cloned', () => {
    const error = makeAxiosError(() => {})

    expect(() => cloneError(error)).not.toThrow()

    const cloned = cloneError(error)

    expect(cloned.isAxiosError).toBe(true)
    expect(cloned.message).toBe('Request failed with status code 400')
    expect(cloned.response).toEqual({
      status: 400,
      statusText: 'Bad Request',
    })
  })
})
