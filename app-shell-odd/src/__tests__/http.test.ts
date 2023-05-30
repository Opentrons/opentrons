import fetch from 'node-fetch'
import isError from 'lodash/isError'

import { HTTP_API_VERSION } from '@opentrons/app/src/redux/robot-api/constants'
import * as Http from '../http'

import type { Request, Response } from 'node-fetch'

jest.mock('../config')
jest.mock('node-fetch')

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('app-shell main http module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
      mockFetch.mockResolvedValueOnce((response as unknown) as Response)

      // @ts-expect-error(mc, 2021-02-17): reqwrite as integration tests and
      // avoid mocking node-fetch
      return method((request as unknown) as Request).then((result: string) => {
        expect(mockFetch).toHaveBeenCalledWith(request, requestOptions)
        expect(result).toEqual(expected)
      })
    })
  })

  FAILURE_SPECS.forEach(spec => {
    const { name, method, request, response, expected } = spec

    it(`it should handle when ${name}`, () => {
      if (isError(response)) {
        mockFetch.mockRejectedValueOnce(response)
      } else {
        mockFetch.mockResolvedValueOnce((response as unknown) as Response)
      }

      return expect(method((request as unknown) as Request)).rejects.toThrow(
        expected
      )
    })
  })
})
