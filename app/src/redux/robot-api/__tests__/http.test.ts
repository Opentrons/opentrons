import FormData from 'form-data'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DELETE, GET, HTTP_API_VERSION, PATCH, POST } from '../constants'
import { fetchRobotApi, robotApiUrl } from '../http'

import type { RobotHost } from '../types'

interface MockResponse {
  ok: boolean
  status: number
  json: ReturnType<typeof vi.fn>
}

const mockJsonResponse = (
  body: unknown,
  {
    ok = true,
    status = 200,
  }: {
    ok?: boolean
    status?: number
  } = {}
): MockResponse => ({
  ok,
  status,
  json: vi.fn().mockResolvedValue(body),
})

describe('robot-api http client', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let robot: RobotHost

  beforeEach(() => {
    fetchMock = vi.fn()
    ;(global as any).fetch = fetchMock
    robot = { name: 'robot-name', ip: '127.0.0.1', port: 31950 }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // @ts-expect-error(sa, 2021-6-28): can't delete non optional properties
    delete global.fetch
  })

  it('can form a valid robot URL', () => {
    const url = robotApiUrl(robot, { method: GET, path: '/health' })

    expect(url).toEqual('http://127.0.0.1:31950/health')
  })

  it('can form a valid robot URL with query params', () => {
    const url = robotApiUrl(robot, {
      method: GET,
      path: '/health',
      query: { refresh: true, meaning: 42 },
    })

    expect(url).toEqual('http://127.0.0.1:31950/health?refresh=true&meaning=42')
  })

  it('removes any empty query params', () => {
    const url = robotApiUrl(robot, {
      method: GET,
      path: '/health',
      query: {
        emptyParam: '',
        nullParam: null,
        voidParam: undefined,
        falseParam: false,
      },
    })

    expect(url).toEqual('http://127.0.0.1:31950/health?falseParam=false')
  })

  it('can make a get request', async () => {
    fetchMock.mockResolvedValueOnce(mockJsonResponse({ hello: 'world' }))

    const result = await fetchRobotApi(robot, {
      method: GET,
      path: '/health',
    }).toPromise()

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:31950/health', {
      method: GET,
      headers: { 'Opentrons-Version': '3' },
    })
    expect(result).toEqual({
      host: robot,
      method: GET,
      path: '/health',
      body: { hello: 'world' },
      status: 200,
      ok: true,
    })
  })

  it('resolves with ok: false on non-2xx', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse({ message: 'not found' }, { ok: false, status: 404 })
    )

    const result = await fetchRobotApi(robot, {
      method: GET,
      path: '/not-found',
    }).toPromise()

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:31950/not-found', {
      method: GET,
      headers: { 'Opentrons-Version': '3' },
    })
    expect(result).toEqual({
      host: robot,
      method: GET,
      path: '/not-found',
      body: { message: 'not found' },
      status: 404,
      ok: false,
    })
  })

  it('can POST a JSON body', async () => {
    const body = { hello: { from: 'the', other: 'side' } }
    fetchMock.mockResolvedValueOnce(mockJsonResponse(body, { status: 201 }))

    const result = await fetchRobotApi(robot, {
      method: POST,
      path: '/post-echo',
      body,
    }).toPromise()

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:31950/post-echo', {
      method: POST,
      headers: {
        'Opentrons-Version': '3',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    expect(result).toEqual({
      host: robot,
      method: POST,
      path: '/post-echo',
      body,
      status: 201,
      ok: true,
    })
  })

  it('can PATCH a JSON body', async () => {
    const body = { i: { must: 'have' }, called: { '1000': 'times' } }
    fetchMock.mockResolvedValueOnce(mockJsonResponse(body))

    const result = await fetchRobotApi(robot, {
      method: PATCH,
      path: '/patch-echo',
      body,
    }).toPromise()

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:31950/patch-echo',
      {
        method: PATCH,
        headers: {
          'Opentrons-Version': '3',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )
    expect(result).toEqual({
      host: robot,
      method: PATCH,
      path: '/patch-echo',
      body,
      status: 200,
      ok: true,
    })
  })

  it('can make a DELETE request', async () => {
    fetchMock.mockResolvedValueOnce(mockJsonResponse({}))

    const result = await fetchRobotApi(robot, {
      method: DELETE,
      path: '/thing-to-delete',
    }).toPromise()

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:31950/thing-to-delete',
      {
        method: DELETE,
        headers: { 'Opentrons-Version': '3' },
      }
    )
    expect(result).toEqual({
      host: robot,
      method: DELETE,
      path: '/thing-to-delete',
      body: {},
      status: 200,
      ok: true,
    })
  })

  it('can POST a multipart body', async () => {
    const form = new FormData() as any
    form.append('file1', Buffer.from('lorem ipsum') as any, '1.txt')
    form.append('file2', Buffer.from('dolor sit amet') as any, '2.txt')

    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(
        {
          files: [
            { key: 'file1', filename: '1.txt', contents: 'lorem ipsum' },
            { key: 'file2', filename: '2.txt', contents: 'dolor sit amet' },
          ],
        },
        { status: 201 }
      )
    )

    const result = await fetchRobotApi(robot, {
      method: POST,
      path: '/file',
      form,
    }).toPromise()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://127.0.0.1:31950/file')
    expect(options).toEqual({
      method: POST,
      headers: { 'Opentrons-Version': '3' },
      body: form,
    })
    expect(result).toEqual({
      host: robot,
      method: POST,
      path: '/file',
      body: {
        files: [
          { key: 'file1', filename: '1.txt', contents: 'lorem ipsum' },
          { key: 'file2', filename: '2.txt', contents: 'dolor sit amet' },
        ],
      },
      status: 201,
      ok: true,
    })
  })

  it('adds the Opentrons-Version header', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse({ version: `${HTTP_API_VERSION}` })
    )

    const result = await fetchRobotApi(robot, {
      method: GET,
      path: '/version',
    }).toPromise()

    expect(HTTP_API_VERSION).toEqual(expect.any(Number))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers).toEqual({ 'Opentrons-Version': '3' })
    expect(result).toEqual({
      host: robot,
      method: GET,
      path: '/version',
      body: { version: `${HTTP_API_VERSION}` },
      status: 200,
      ok: true,
    })
  })
})
