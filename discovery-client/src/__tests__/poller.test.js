import fetch from 'node-fetch'
import { poll, stop } from '../poller'

jest.mock('node-fetch')

describe('discovery poller', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    fetch.__setMockResponse({ ok: false })
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    fetch.__mockReset()
  })

  it('returns empty poll request if no candidates', () => {
    const request = poll([], 5000, jest.fn())
    expect(request.id).toBe(null)
  })

  it('sets an interval to poll candidates evenly', () => {
    poll(
      [{ ip: 'foo', port: 31950 }, { ip: 'bar', port: 31950 }],
      6000,
      jest.fn()
    )

    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 3000)
    setInterval.mockClear()

    poll(
      [
        { ip: 'foo', port: 31950 },
        { ip: 'bar', port: 31950 },
        { ip: 'baz', port: 31950 },
      ],
      6000,
      jest.fn()
    )

    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 2000)
  })

  it('will not set a subinterval smaller than 100ms', () => {
    poll(
      [{ ip: 'foo', port: 31950 }, { ip: 'bar', port: 31950 }],
      42,
      jest.fn()
    )

    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 100)
  })

  it('returns interval ID in request object', () => {
    const intervalId = 1234
    setInterval.mockReturnValueOnce(intervalId)

    const request = poll(
      [{ ip: 'foo', port: 31950 }, { ip: 'bar', port: 31950 }],
      6000,
      jest.fn()
    )

    expect(request.id).toEqual(intervalId)
  })

  it('can stop polling', () => {
    const request = { id: 1234 }

    stop(request)
    expect(clearInterval).toHaveBeenCalledWith(1234)
  })

  it('calls fetch health for all candidates in an interval', () => {
    poll(
      [
        { ip: 'foo', port: 31950 },
        { ip: 'bar', port: 31950 },
        { ip: 'baz', port: 31950 },
      ],
      6000,
      jest.fn()
    )

    jest.runTimersToTime(6000)
    expect(fetch).toHaveBeenCalledTimes(6)
    expect(fetch).toHaveBeenCalledWith(`http://foo:31950/health`, {
      timeout: 30000,
    })
    expect(fetch).toHaveBeenCalledWith(`http://bar:31950/health`, {
      timeout: 30000,
    })
    expect(fetch).toHaveBeenCalledWith(`http://baz:31950/health`, {
      timeout: 30000,
    })
    expect(fetch).toHaveBeenCalledWith(
      `http://foo:31950/server/update/health`,
      { timeout: 30000 }
    )
    expect(fetch).toHaveBeenCalledWith(
      `http://bar:31950/server/update/health`,
      { timeout: 30000 }
    )
    expect(fetch).toHaveBeenCalledWith(
      `http://baz:31950/server/update/health`,
      { timeout: 30000 }
    )
  })

  it('calls onHealth with health response if successful', done => {
    fetch.__setMockResponse({
      ok: true,
      json: () => Promise.resolve({ name: 'foo' }),
    })

    poll([{ ip: 'foo', port: 31950 }], 1000, (candidate, apiRes, serverRes) => {
      expect(candidate).toEqual({ ip: 'foo', port: 31950 })
      expect(apiRes).toEqual({ name: 'foo' })
      expect(serverRes).toEqual({ name: 'foo' })
      done()
    })

    jest.runTimersToTime(1000)
  }, 10)

  it('calls onHealth with null response if fetch not ok', done => {
    fetch.__setMockResponse({
      ok: false,
      json: () => Promise.resolve({ message: 'oh no!' }),
    })

    poll([{ ip: 'foo', port: 31950 }], 1000, (candidate, apiRes, serverRes) => {
      expect(candidate).toEqual({ ip: 'foo', port: 31950 })
      expect(apiRes).toEqual(null)
      expect(serverRes).toEqual(null)
      done()
    })

    jest.runTimersToTime(1000)
  }, 10)

  it('calls onHealth with null response if fetch rejects', done => {
    fetch.__setMockError(new Error('failed to fetch'))

    poll([{ ip: 'foo', port: 31950 }], 1000, (candidate, apiRes, serverRes) => {
      expect(candidate).toEqual({ ip: 'foo', port: 31950 })
      expect(apiRes).toEqual(null)
      expect(serverRes).toEqual(null)
      done()
    })

    jest.runTimersToTime(1000)
  }, 10)

  it('calls onHealth with null response if JSON parse rejects', done => {
    fetch.__setMockResponse({
      ok: true,
      json: () => Promise.reject(new Error('oh no!')),
    })

    poll([{ ip: 'foo', port: 31950 }], 1000, (candidate, apiRes, serverRes) => {
      expect(candidate).toEqual({ ip: 'foo', port: 31950 })
      expect(apiRes).toEqual(null)
      expect(serverRes).toEqual(null)
      done()
    })

    jest.runTimersToTime(1000)
  }, 10)
})
