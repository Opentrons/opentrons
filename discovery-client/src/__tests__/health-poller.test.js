// @flow
import nodeFetch from 'node-fetch'
import { isError } from 'lodash'

import * as Fixtures from '../__fixtures__/health'
import { createHealthPoller } from '../health-poller'

import type { Request, RequestInit, Response } from 'node-fetch'

// TODO(mc, 2020-07-13): remove __mocks__/node-fetch
jest.mock('node-fetch', () => ({ __esModule: true, default: jest.fn() }))

const fetch: JestMockFn<
  [string | Request, ?RequestInit],
  $Call<typeof nodeFetch, any, any>
> = nodeFetch

const EXPECTED_FETCH_OPTS = { timeout: 10000 }

const stubFetchOnce = (
  stubUrl: string,
  stubOptions: RequestInit = EXPECTED_FETCH_OPTS
) => (response: $Shape<Response> | Error) => {
  fetch.mockImplementationOnce((url, options) => {
    expect(url).toBe(stubUrl)
    expect(options).toEqual(stubOptions)

    return isError(response)
      ? Promise.reject(response)
      : Promise.resolve(((response: any): Response))
  })
}

const makeMockJsonResponse = (
  body: any,
  ok = true,
  status = 200
): $Shape<Response> => {
  return { ok, status, text: () => Promise.resolve(JSON.stringify(body)) }
}

const HOST_1 = { ip: '127.0.0.1', port: 31950 }
const HOST_2 = { ip: '127.0.0.2', port: 31950 }
const HOST_3 = { ip: '127.0.0.3', port: 31950 }

const flush = () => new Promise(resolve => setImmediate(resolve))

describe('health poller', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    fetch.mockResolvedValue(
      ({
        ok: false,
        status: 500,
        text: () => Promise.resolve('AH'),
      }: any)
    )
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  it('should call GET /health and GET /server/update/health', () => {
    const poller = createHealthPoller({
      list: [HOST_1, HOST_2, HOST_3],
      interval: 1000,
      onPollResult: () => {},
    })

    const expectedFetches = [
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
      'http://127.0.0.2:31950/health',
      'http://127.0.0.2:31950/server/update/health',
      'http://127.0.0.3:31950/health',
      'http://127.0.0.3:31950/server/update/health',
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
      'http://127.0.0.2:31950/health',
      'http://127.0.0.2:31950/server/update/health',
      'http://127.0.0.3:31950/health',
      'http://127.0.0.3:31950/server/update/health',
    ]

    poller.start()
    jest.advanceTimersByTime(2000)
    expect(fetch).toHaveBeenCalledTimes(expectedFetches.length)
    expectedFetches.forEach((url, idx) => {
      expect(fetch).toHaveBeenNthCalledWith(idx + 1, url, EXPECTED_FETCH_OPTS)
    })
  })

  it('should not poll until started', () => {
    createHealthPoller({
      list: [HOST_1, HOST_2, HOST_3],
      interval: 1000,
      onPollResult: () => {},
    })

    jest.advanceTimersByTime(2000)
    expect(fetch).toHaveBeenCalledTimes(0)
  })

  it('should be able to stop polling', () => {
    const poller = createHealthPoller({
      list: [HOST_1, HOST_2, HOST_3],
      interval: 1000,
      onPollResult: () => {},
    })

    poller.start()
    poller.stop()
    jest.advanceTimersByTime(2000)
    expect(fetch).toHaveBeenCalledTimes(0)
  })

  it('should be able to restart with a new list', () => {
    const poller = createHealthPoller({
      list: [HOST_1, HOST_2],
      interval: 1000,
      onPollResult: () => {},
    })

    poller.start()
    jest.advanceTimersByTime(1000)
    poller.start({ list: [HOST_1, HOST_3] })
    jest.advanceTimersByTime(1000)

    const expectedFetches = [
      // round 1: poll HOST_1 and HOST_2
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
      'http://127.0.0.2:31950/health',
      'http://127.0.0.2:31950/server/update/health',
      // round 2: HOST_1 still in list, HOST_2 removed, HOST_3 added
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
      'http://127.0.0.3:31950/health',
      'http://127.0.0.3:31950/server/update/health',
    ]

    expect(fetch).toHaveBeenCalledTimes(expectedFetches.length)
    expectedFetches.forEach((url, idx) => {
      expect(fetch).toHaveBeenNthCalledWith(idx + 1, url, EXPECTED_FETCH_OPTS)
    })
  })

  it('should be able to restart with a new list and new polling interval', () => {
    const poller = createHealthPoller({
      list: [HOST_1, HOST_2],
      interval: 1000,
      onPollResult: () => {},
    })

    poller.start()
    jest.advanceTimersByTime(1000)
    poller.start({ list: [HOST_1, HOST_3], interval: 2000 })
    jest.advanceTimersByTime(2000)

    const expectedFetches = [
      // round 1: poll HOST_1 and HOST_2
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
      'http://127.0.0.2:31950/health',
      'http://127.0.0.2:31950/server/update/health',
      // round 2: HOST_1 still in list, HOST_2 removed, HOST_3 added
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
      'http://127.0.0.3:31950/health',
      'http://127.0.0.3:31950/server/update/health',
    ]

    expect(fetch).toHaveBeenCalledTimes(expectedFetches.length)
    expectedFetches.forEach((url, idx) => {
      expect(fetch).toHaveBeenNthCalledWith(idx + 1, url, EXPECTED_FETCH_OPTS)
    })
  })

  it('should not lose queue order on restart with same list contents', () => {
    const poller = createHealthPoller({
      list: [HOST_1, HOST_2],
      interval: 1000,
      onPollResult: () => {},
    })

    poller.start()
    jest.advanceTimersByTime(500)
    poller.start({ list: [HOST_1, HOST_2] })
    jest.advanceTimersByTime(500)

    const expectedFetches = [
      // round 1: poll HOST_1
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
      // round 2: poll HOST_2 after list "refreshed"
      'http://127.0.0.2:31950/health',
      'http://127.0.0.2:31950/server/update/health',
    ]

    expect(fetch).toHaveBeenCalledTimes(expectedFetches.length)
    expectedFetches.forEach((url, idx) => {
      expect(fetch).toHaveBeenNthCalledWith(idx + 1, url, EXPECTED_FETCH_OPTS)
    })
  })

  it('should map successful fetch responses to onPollResult', () => {
    const onPollResult = jest.fn()

    stubFetchOnce('http://127.0.0.1:31950/health')(
      makeMockJsonResponse(Fixtures.mockHealthResponse)
    )
    stubFetchOnce('http://127.0.0.1:31950/server/update/health')(
      makeMockJsonResponse(Fixtures.mockServerHealthResponse)
    )

    const poller = createHealthPoller({
      list: [HOST_1],
      interval: 1000,
      onPollResult,
    })

    poller.start()
    jest.advanceTimersByTime(1000)

    return flush().then(() => {
      expect(onPollResult).toHaveBeenCalledWith({
        ip: '127.0.0.1',
        port: 31950,
        health: Fixtures.mockHealthResponse,
        serverHealth: Fixtures.mockServerHealthResponse,
        healthError: null,
        serverHealthError: null,
      })
    })
  })

  it('should map partially successful fetch responses to onPollResult', () => {
    const onPollResult = jest.fn()

    stubFetchOnce('http://127.0.0.1:31950/health')(
      makeMockJsonResponse({ message: 'some error' }, false, 400)
    )
    stubFetchOnce('http://127.0.0.1:31950/server/update/health')(
      makeMockJsonResponse(Fixtures.mockServerHealthResponse)
    )

    const poller = createHealthPoller({
      list: [HOST_1],
      interval: 1000,
      onPollResult,
    })

    poller.start()
    jest.advanceTimersByTime(1000)

    return flush().then(() => {
      expect(onPollResult).toHaveBeenCalledWith({
        ip: '127.0.0.1',
        port: 31950,
        health: null,
        serverHealth: Fixtures.mockServerHealthResponse,
        healthError: { status: 400, body: { message: 'some error' } },
        serverHealthError: null,
      })
    })
  })

  it('should map routable but failed responses to onPollResult', () => {
    const onPollResult = jest.fn()

    stubFetchOnce('http://127.0.0.1:31950/health')({
      ok: false,
      status: 504,
      text: () => Promise.resolve('Gateway timeout'),
    })
    stubFetchOnce('http://127.0.0.1:31950/server/update/health')({
      ok: false,
      status: 504,
      text: () => Promise.resolve('Gateway timeout'),
    })

    const poller = createHealthPoller({
      list: [HOST_1],
      interval: 1000,
      onPollResult,
    })

    poller.start()
    jest.advanceTimersByTime(1000)

    return flush().then(() => {
      expect(onPollResult).toHaveBeenCalledWith({
        ip: '127.0.0.1',
        port: 31950,
        health: null,
        serverHealth: null,
        healthError: { status: 504, body: 'Gateway timeout' },
        serverHealthError: { status: 504, body: 'Gateway timeout' },
      })
    })
  })

  it('should map fetch errors to onPollResult', () => {
    const onPollResult = jest.fn()

    stubFetchOnce('http://127.0.0.1:31950/health')(new Error('Failed to fetch'))
    stubFetchOnce('http://127.0.0.1:31950/server/update/health')(
      new Error('Failed to fetch')
    )

    const poller = createHealthPoller({
      list: [HOST_1],
      interval: 1000,
      onPollResult,
    })

    poller.start()
    jest.advanceTimersByTime(1000)

    return flush().then(() => {
      expect(onPollResult).toHaveBeenCalledWith({
        ip: '127.0.0.1',
        port: 31950,
        health: null,
        serverHealth: null,
        healthError: { status: -1, body: 'Failed to fetch' },
        serverHealthError: { status: -1, body: 'Failed to fetch' },
      })
    })
  })

  it('should spread its fetches out over the interval', () => {
    const poller = createHealthPoller({
      list: [HOST_1, HOST_2, HOST_3],
      interval: 300,
      onPollResult: () => {},
    })

    const expectedFetches = [
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
      'http://127.0.0.2:31950/health',
      'http://127.0.0.2:31950/server/update/health',
      'http://127.0.0.3:31950/health',
      'http://127.0.0.3:31950/server/update/health',
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
    ]

    poller.start()
    jest.advanceTimersByTime(100)
    expect(fetch).toHaveBeenCalledTimes(2)
    expectedFetches.slice(0, 2).forEach((url, idx) => {
      expect(fetch).toHaveBeenNthCalledWith(idx + 1, url, EXPECTED_FETCH_OPTS)
    })

    fetch.mockClear()
    jest.advanceTimersByTime(100)
    expect(fetch).toHaveBeenCalledTimes(2)
    expectedFetches.slice(2, 4).forEach((url, idx) => {
      expect(fetch).toHaveBeenNthCalledWith(idx + 1, url, EXPECTED_FETCH_OPTS)
    })

    fetch.mockClear()
    jest.advanceTimersByTime(100)
    expect(fetch).toHaveBeenCalledTimes(2)
    expectedFetches.slice(4, 6).forEach((url, idx) => {
      expect(fetch).toHaveBeenNthCalledWith(idx + 1, url, EXPECTED_FETCH_OPTS)
    })

    fetch.mockClear()
    jest.advanceTimersByTime(100)
    expect(fetch).toHaveBeenCalledTimes(2)
    expectedFetches.slice(6, 8).forEach((url, idx) => {
      expect(fetch).toHaveBeenNthCalledWith(idx + 1, url, EXPECTED_FETCH_OPTS)
    })
  })

  it('should ignore late responses', () => {
    // TODO(mc, 2020-07-13): Jest v25 fake timers do not mock Date.now,
    // so this test needs real timers. Move back to fake timers after upgrade
    jest.useRealTimers()

    const onPollResult = jest.fn()
    const poller = createHealthPoller({
      list: [HOST_1],
      // NOTE(mc, 2020-07-13): see TODO above. This value chosen to work well
      // with real time but runs the risk of being flakey because setTimeout
      // is not exact in real life
      interval: 50,
      onPollResult,
    })

    // the first two calls the fetch (/health and /server/update/health) will error
    // out _after_ the second two calls are made and completed
    const mockErrorImpl = () => {
      return new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('Oh no eventual error!')), 75)
      })
    }
    fetch.mockImplementationOnce(mockErrorImpl)
    fetch.mockImplementationOnce(mockErrorImpl)

    // the second two calls with successfully resolve quickly before the first
    // two calls return their eventual errors
    stubFetchOnce('http://127.0.0.1:31950/health')(
      makeMockJsonResponse(Fixtures.mockHealthResponse)
    )
    stubFetchOnce('http://127.0.0.1:31950/server/update/health')(
      makeMockJsonResponse(Fixtures.mockServerHealthResponse)
    )

    poller.start()

    return new Promise(resolve => setTimeout(resolve, 150)).then(() => {
      // ensure that the fact that the second poll returned means the eventual
      // errors for the first poll are thrown away
      expect(onPollResult).toHaveBeenCalledTimes(1)
      expect(onPollResult).toHaveBeenCalledWith({
        ip: '127.0.0.1',
        port: 31950,
        health: Fixtures.mockHealthResponse,
        serverHealth: Fixtures.mockServerHealthResponse,
        healthError: null,
        serverHealthError: null,
      })
    })
  })

  it('should ignore responses after stop()', () => {
    const onPollResult = jest.fn()
    const poller = createHealthPoller({
      list: [HOST_1],
      interval: 50,
      onPollResult,
    })

    const mockErrorImpl = () => {
      return new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('Oh no eventual error!')), 25)
      })
    }
    fetch.mockImplementationOnce(mockErrorImpl)
    fetch.mockImplementationOnce(mockErrorImpl)

    poller.start()
    jest.advanceTimersByTime(50)
    poller.stop()
    jest.advanceTimersByTime(50)

    return flush().then(() => {
      expect(onPollResult).toHaveBeenCalledTimes(0)
    })
  })
})
