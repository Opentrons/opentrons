import { createHash } from 'crypto'
import { access, mkdtemp, readFile, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { Readable } from 'stream'
import isError from 'lodash/isError'
import fetch from 'node-fetch'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HTTP_API_VERSION } from '@opentrons/app/src/redux/robot-api/constants'

import * as Http from '../http'

import type { Request, Response } from 'node-fetch'

vi.mock('../config')
vi.mock('node-fetch')

const CONTENT_DIGEST_HEADER = 'content-digest'

function sha256ContentDigest(contents: string): string {
  const digest = createHash('sha256').update(contents).digest('base64')
  return `sha-256=:${digest}:`
}

function mockDownloadResponse(
  body: string,
  headers: Record<string, string | null> = {}
): void {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    headers: {
      get: (name: string) => headers[name] ?? null,
    },
    body: Readable.from(Buffer.from(body)),
  } as unknown as Response)
}

describe('app-shell main http module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('postFile rejects when fetch fails so IPC invoke can reply', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'postfile-'))
    const filePath = path.join(dir, 'update.zip')
    await writeFile(filePath, 'zip-bytes')
    vi.mocked(fetch).mockRejectedValueOnce(
      new Error('certificate verify failed')
    )

    await expect(
      Http.postFile(
        'https://robot.local:32313/server/update/file',
        'file',
        filePath
      )
    ).rejects.toThrow(/certificate verify failed/)
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
      vi.mocked(fetch).mockResolvedValueOnce(response as unknown as Response)

      return method(request as unknown as Request).then((result: unknown) => {
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
        vi.mocked(fetch).mockResolvedValueOnce(response as unknown as Response)
      }

      return expect(method(request as unknown as Request)).rejects.toThrow(
        expected
      )
    })
  })

  describe('fetchToFile', () => {
    let destination: string

    beforeEach(async () => {
      const dir = await mkdtemp(path.join(tmpdir(), 'fetch-to-file-'))
      destination = path.join(dir, 'logperiod.zip')
    })

    it('writes the response body to the destination', async () => {
      mockDownloadResponse('zip-bytes')

      await expect(
        Http.fetchToFile('http://example.com/file', destination)
      ).resolves.toBe(destination)
      expect(await readFile(destination, 'utf8')).toBe('zip-bytes')
    })

    it('succeeds when the Content-Digest header matches the downloaded bytes', async () => {
      const body = 'zip-bytes'
      mockDownloadResponse(body, {
        [CONTENT_DIGEST_HEADER]: sha256ContentDigest(body),
      })

      await expect(
        Http.fetchToFile('http://example.com/file', destination)
      ).resolves.toBe(destination)
      expect(await readFile(destination, 'utf8')).toBe(body)
    })

    it('skips hash verification when the server omits the Content-Digest header', async () => {
      mockDownloadResponse('zip-bytes')

      await expect(
        Http.fetchToFile('http://example.com/file', destination)
      ).resolves.toBe(destination)
      expect(await readFile(destination, 'utf8')).toBe('zip-bytes')
    })

    it('rejects and deletes the file when the Content-Digest header does not match', async () => {
      mockDownloadResponse('zip-bytes', {
        [CONTENT_DIGEST_HEADER]: sha256ContentDigest('different-bytes'),
      })

      await expect(
        Http.fetchToFile('http://example.com/file', destination)
      ).rejects.toThrow('Downloaded file hash does not match expected hash')
      await expect(access(destination)).rejects.toMatchObject({
        code: 'ENOENT',
      })
    })
  })
})
