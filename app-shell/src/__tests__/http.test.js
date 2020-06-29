import isError from 'lodash/isError'
import mockFetch from 'node-fetch'

import * as Http from '../http'

jest.mock('../config')
jest.mock('node-fetch', () => jest.fn())

describe('app-shell main http module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const SUCCESS_SPECS = [
    {
      name: 'regular fetch',
      method: Http.fetch,
      request: 'http://exmple.com',
      response: { ok: true },
      expected: { ok: true },
    },
    {
      name: 'fetchJson parses json',
      method: Http.fetchJson,
      request: 'http://exmple.com',
      response: { ok: true, json: () => Promise.resolve({ json: 'json' }) },
      expected: { json: 'json' },
    },
    {
      name: 'fetchText parses text',
      method: Http.fetchText,
      request: 'http://exmple.com',
      response: { ok: true, text: () => Promise.resolve('text!') },
      expected: 'text!',
    },
  ]

  const FAILURE_SPECS = [
    {
      name: 'regular fetch fails',
      method: Http.fetch,
      request: 'http://exmple.com',
      response: new Error('Failed to fetch'),
      expected: /Failed to fetch/,
    },
    {
      name: 'regular fetch returns non-success',
      method: Http.fetch,
      request: 'http://exmple.com',
      response: { ok: false, status: 500, statusText: 'Internal Server Error' },
      expected: /Request error: 500 - Internal Server Error/,
    },
    {
      name: 'fetchJson fails to parse',
      method: Http.fetchJson,
      request: 'http://exmple.com',
      response: { ok: true, json: () => Promise.reject(new Error('BAD')) },
      expected: /BAD/,
    },
    {
      name: 'fetchText fails to parse text',
      method: Http.fetchText,
      request: 'http://exmple.com',
      response: { ok: true, text: () => Promise.reject(new Error('BAD')) },
      expected: /BAD/,
    },
  ]

  SUCCESS_SPECS.forEach(spec => {
    const { name, method, request, requestOptions, response, expected } = spec

    it(name, () => {
      mockFetch.mockResolvedValueOnce(response)

      return method(request).then(result => {
        expect(mockFetch).toHaveBeenCalledWith(request, requestOptions)
        expect(result).toEqual(expected)
      })
    })
  })

  FAILURE_SPECS.forEach(spec => {
    const { name, method, request, response, expected } = spec

    it(name, () => {
      if (isError(response)) {
        mockFetch.mockRejectedValueOnce(response)
      } else {
        mockFetch.mockResolvedValueOnce(response)
      }

      return expect(method(request)).rejects.toThrow(expected)
    })
  })
})
