// http api client tests
import { client } from '../client'

const mockResolve = value =>
  jest.fn(
    () =>
      new Promise(resolve => {
        process.nextTick(() => resolve(value))
      })
  )

const mockReject = error =>
  jest.fn(
    () =>
      new Promise((resolve, reject) => {
        process.nextTick(() => reject(error))
      })
  )

describe('http api client', () => {
  let _oldFetch

  beforeAll(() => {
    // mock fetch
    _oldFetch = global.fetch
    global.fetch = mockResolve({ ok: false })
  })

  afterAll(() => {
    global.fetch = _oldFetch
  })

  beforeEach(() => {
    global.fetch.mockClear()
  })

  it('GET request', () => {
    const robot = {
      ip: '1.2.3.4',
      port: 8080,
    }

    global.fetch = mockResolve({
      ok: true,
      json: () => Promise.resolve({ foo: 'bar' }),
    })

    return expect(client(robot, 'GET', 'foo'))
      .resolves.toEqual({ foo: 'bar' })
      .then(() =>
        expect(global.fetch).toHaveBeenCalledWith('http://1.2.3.4:8080/foo', {
          method: 'GET',
          headers: {},
          body: undefined,
        })
      )
  })

  it('GET request failure', () => {
    const robot = {
      ip: '1.2.3.4',
      port: 8080,
    }

    global.fetch = mockResolve({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ message: 'You tried' }),
    })

    return expect(client(robot, 'GET', 'foo')).rejects.toEqual(
      expect.objectContaining({
        status: 400,
        statusText: 'Bad Request',
        message: 'You tried',
      })
    )
  })

  it('GET request error', () => {
    const robot = {
      ip: '1.2.3.4',
      port: 8080,
    }

    global.fetch = mockReject(new Error('AH'))

    return expect(client(robot, 'GET', 'foo')).rejects.toEqual(
      expect.objectContaining({
        message: 'AH',
      })
    )
  })

  it('POST request', () => {
    const robot = {
      ip: '1.2.3.4',
      port: 8080,
    }

    global.fetch = mockResolve({
      ok: true,
      json: () => Promise.resolve({ foo: 'bar' }),
    })

    return expect(client(robot, 'POST', 'foo', { bar: 'baz' }))
      .resolves.toEqual({ foo: 'bar' })
      .then(() =>
        expect(global.fetch).toHaveBeenCalledWith('http://1.2.3.4:8080/foo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bar: 'baz' }),
        })
      )
  })

  it('POST request failure', () => {
    const robot = {
      ip: '1.2.3.4',
      port: 8080,
    }

    global.fetch = mockResolve({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ message: 'You tried' }),
    })

    return expect(client(robot, 'POST', 'foo', { bar: 'baz' })).rejects.toEqual(
      expect.objectContaining({
        status: 400,
        statusText: 'Bad Request',
        message: 'You tried',
      })
    )
  })

  it('POST request error', () => {
    const robot = {
      ip: '1.2.3.4',
      port: 8080,
    }

    global.fetch = mockReject(new Error('AH'))

    return expect(client(robot, 'POST', 'foo', { bar: 'baz' })).rejects.toEqual(
      expect.objectContaining({
        message: 'AH',
      })
    )
  })
})
