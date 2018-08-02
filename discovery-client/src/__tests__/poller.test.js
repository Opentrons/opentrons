import fetch from 'node-fetch'
import {poll, stop} from '../poller'

jest.mock('node-fetch')

describe('discovery poller', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    fetch.__setMockResponse({ok: false})
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    fetch.__mockReset()
  })

  test('returns empty poll request if no candidates', () => {
    const request = poll([], 5000, jest.fn())
    expect(request.id).toBe(null)
  })

  test('sets an interval to poll candidates evenly', () => {
    poll([{ip: 'foo', port: 31950}, {ip: 'bar', port: 31950}], 6000, jest.fn())

    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 3000)
    setInterval.mockClear()

    poll(
      [
        {ip: 'foo', port: 31950},
        {ip: 'bar', port: 31950},
        {ip: 'baz', port: 31950}
      ],
      6000,
      jest.fn()
    )

    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 2000)
  })

  test('returns interval ID in request object', () => {
    const intervalId = 1234
    setInterval.mockReturnValueOnce(intervalId)

    const request = poll(
      [{ip: 'foo', port: 31950}, {ip: 'bar', port: 31950}],
      6000,
      jest.fn()
    )

    expect(request.id).toEqual(intervalId)
  })

  test('can stop polling', () => {
    const request = {id: 1234}

    stop(request)
    expect(clearInterval).toHaveBeenCalledWith(1234)
  })

  test('calls fetch health for all candidates in an interval', () => {
    poll(
      [
        {ip: 'foo', port: 31950},
        {ip: 'bar', port: 31950},
        {ip: 'baz', port: 31950}
      ],
      6000,
      jest.fn()
    )

    jest.runTimersToTime(6000)
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(fetch).toHaveBeenCalledWith(`http://foo:31950/health`)
    expect(fetch).toHaveBeenCalledWith(`http://bar:31950/health`)
    expect(fetch).toHaveBeenCalledWith(`http://baz:31950/health`)
  })

  test('calls onHealth with health response if successful', done => {
    fetch.__setMockResponse({
      ok: true,
      json: () => Promise.resolve({name: 'foo'})
    })

    poll([{ip: 'foo', port: 31950}], 1000, (candidate, response) => {
      expect(candidate).toEqual({ip: 'foo', port: 31950})
      expect(response).toEqual({name: 'foo'})
      done()
    })

    jest.runTimersToTime(1000)
  })

  test('calls onHealth with null response if fetch not ok', done => {
    fetch.__setMockResponse({
      ok: false,
      json: () => Promise.resolve({message: 'oh no!'})
    })

    poll([{ip: 'foo', port: 31950}], 1000, (candidate, response) => {
      expect(candidate).toEqual({ip: 'foo', port: 31950})
      expect(response).toEqual(null)
      done()
    })

    jest.runTimersToTime(1000)
  })

  test('calls onHealth with null response if fetch rejects', done => {
    fetch.__setMockError(new Error('failed to fetch'))

    poll([{ip: 'foo', port: 31950}], 1000, (candidate, response) => {
      expect(candidate).toEqual({ip: 'foo', port: 31950})
      expect(response).toEqual(null)
      done()
    })

    jest.runTimersToTime(1000)
  })
})
