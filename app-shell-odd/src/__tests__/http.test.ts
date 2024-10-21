import fetch from 'node-fetch'
import isError from 'lodash/isError'
import { describe, it, vi, expect, beforeEach } from 'vitest'

import { HTTP_API_VERSION } from '../constants'
import * as Http from '../http'

import type { Request, Response } from 'node-fetch'

vi.mock('../config')
vi.mock('node-fetch')
vi.mock('../log')

describe('app-shell main http module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const SUCCESS_SPECS = [
    {
      name: 'regular fetch',
      method: Http.fetch,
      request: 'http://example.com',
      requestOptions: {
        headers: { 'Opentrons-Version': `${HTTP_API_VERSION}` },
      },
      response: { ok: true },
      expected: { ok: true },
    },
    {
      name: 'fetchJson parses json',
      method: Http.fetchJson,
      request: 'http://example.com',
      requestOptions: {
        headers: { 'Opentrons-Version': `${HTTP_API_VERSION}` },
      },
      response: { ok: true, json: () => Promise.resolve({ json: 'json' }) },
      expected: { json: 'json' },
    },
    {
      name: 'fetchText parses text',
      method: Http.fetchText,
      request: 'http://example.com',
      requestOptions: {
        headers: { 'Opentrons-Version': `${HTTP_API_VERSION}` },
      },
      response: { ok: true, text: () => Promise.resolve('text!') },
      expected: 'text!',
    },
  ]

  const FAILURE_SPECS = [
    {
      name: 'regular fetch fails',
      method: Http.fetch,
      request: 'http://example.com',
      response: new Error('Failed to fetch'),
      expected: /Failed to fetch/,
    },
    {
      name: 'regular fetch returns non-success',
      method: Http.fetch,
      request: 'http://example.com',
      response: { ok: false, status: 500, statusText: 'Internal Server Error' },
      expected: /Request error: 500 - Internal Server Error/,
    },
    {
      name: 'fetchJson fails to parse',
      method: Http.fetchJson,
      request: 'http://example.com',
      response: { ok: true, json: () => Promise.reject(new Error('BAD')) },
      expected: /BAD/,
    },
    {
      name: 'fetchText fails to parse text',
      method: Http.fetchText,
      request: 'http://example.com',
      response: { ok: true, text: () => Promise.reject(new Error('BAD')) },
      expected: /BAD/,
    },
  ]

  SUCCESS_SPECS.forEach(spec => {
    const { name, method, request, requestOptions, response, expected } = spec

    it(`it should handle when ${name}`, () => {
      vi.mocked(fetch).mockResolvedValueOnce((response as unknown) as Response)

      // @ts-expect-error(mc, 2021-02-17): reqwrite as integration tests and
      // avoid mocking node-fetch
      return method((request as unknown) as Request).then((result: string) => {
        expect(vi.mocked(fetch)).toHaveBeenCalledWith(request, requestOptions)
        expect(result).toEqual(expected)
      })
    })
  })

  FAILURE_SPECS.forEach(spec => {
    const { name, method, request, response, expected } = spec

    it(`it should handle when ${name}`, () => {
      if (isError(response)) {
        vi.mocked(fetch).mockRejectedValueOnce(response)
      } else {
        vi.mocked(fetch).mockResolvedValueOnce(
          (response as unknown) as Response
        )
      }

      return expect(method((request as unknown) as Request)).rejects.toThrow(
        expected
      )
    })
  })
})
