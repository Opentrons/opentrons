// fetch wrapper to throw if response is not ok
import { createHash } from 'crypto'
import fs from 'fs'
import { Transform } from 'stream'
import FormData from 'form-data'
import { remove } from 'fs-extra'
import _fetch from 'node-fetch'
import pump from 'pump'

import { HTTP_API_VERSION } from './constants'
import { createLogger } from './log'

import type { Request, RequestInit, Response } from 'node-fetch'
import type { Readable } from 'stream'

const log = createLogger('http')

const SHA256_HEADER = 'opentrons-download-sha256'

type RequestInput = Request | string

export interface DownloadProgress {
  downloaded: number
  size: number | null
}

export class LocalAbortError extends Error {
  declare readonly name: 'LocalAbortError'
  declare readonly type: 'aborted'
  constructor(message: string) {
    super(message)
    this.name = 'LocalAbortError'
    this.type = 'aborted'
  }
}

export function fetch(
  input: RequestInput,
  init?: RequestInit
): Promise<Response> {
  const opts = init ?? {}
  opts.headers = { ...opts.headers, 'Opentrons-Version': `${HTTP_API_VERSION}` }

  return _fetch(input, opts).then(response => {
    if (!response.ok) {
      const error = `${response.status} - ${response.statusText}`
      throw new Error(`Request error: ${error}`)
    }

    return response
  })
}

export function fetchJson<Body>(
  input: RequestInput,
  init?: RequestInit
): Promise<Body> {
  return fetch(input, init).then(response => response.json())
}

export function fetchText(input: Request, init?: RequestInit): Promise<string> {
  return fetch(input, init).then(response => response.text())
}

export interface FetchToFileOptions {
  onProgress: (progress: DownloadProgress) => unknown
  onResponse: (response: Response) => unknown
  signal: AbortSignal
}

// TODO(mc, 2019-07-02): break this function up and test its components
export function fetchToFile(
  input: RequestInput,
  destination: string,
  options?: Partial<FetchToFileOptions>
): Promise<string> {
  return fetch(input, { signal: options?.signal }).then(response => {
    options?.onResponse?.(response)
    let downloaded = 0
    const size = Number(response.headers.get('Content-Length')) ?? null

    const correctHash = response.headers.get(SHA256_HEADER)
    const hasher = createHash('sha256')

    // with node-fetch, response.body will be a Node.js readable stream
    // rather than a browser-land ReadableStream
    const inputStream = response.body
    const outputStream = fs.createWriteStream(destination)

    // pass-through stream to report read progress
    const onProgress = options?.onProgress
    const progressReader = new Transform({
      transform(chunk: string | Buffer, encoding, next) {
        downloaded += chunk.length
        if (correctHash != null) {
          hasher.update(chunk)
        }
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (onProgress) onProgress({ downloaded, size })
        next(null, chunk)
      },
    })

    // pump returns a stream, so use the promise constructor rather than
    // messing with util.promisify
    return new Promise((resolve, reject) => {
      // pump calls stream.pipe, handles teardown if streams error, and calls
      // its callbacks when the streams are done
      pump(inputStream, progressReader, outputStream, error => {
        const handleError = (problem: Error): void => {
          log.error(`Aborting fetchToFile: ${problem.name}: ${problem.message}`)
          remove(destination).then(() => {
            reject(problem)
          })
        }
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (error) {
          handleError(error)
          return
        }

        if (
          correctHash != null &&
          hasher.digest('hex').toLowerCase() !== correctHash?.toLowerCase()
        ) {
          handleError(
            new Error('Downloaded file hash does not match expected hash')
          )
          return
        }

        resolve(destination)
      })
    })
  })
}

export function postFile(
  input: RequestInput,
  name: string,
  source: string,
  init?: RequestInit
): Promise<Response> {
  return new Promise<Response>((resolve, reject) => {
    createReadStream(source, reject).then(readStream =>
      new Promise<Response>(resolve => {
        const body = new FormData()
        body.append(name, readStream)
        const formHeaders =
          typeof body.getHeaders === 'function' ? body.getHeaders() : {}
        const initHeaders =
          init?.headers != null && !Array.isArray(init.headers)
            ? (init.headers as Record<string, string>)
            : {}

        resolve(
          fetch(input, {
            ...init,
            body,
            method: 'POST',
            headers: {
              ...formHeaders,
              ...initHeaders,
            },
          })
        )
      }).then(resolve)
    )
  })
}

// create a read stream, handling errors that `fetch` is unable to catch
function createReadStream(
  source: string,
  onError: (error: unknown) => unknown
): Promise<Readable> {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(source)
    const scheduledResolve = setTimeout(handleSuccess, 0)

    readStream.once('error', handleError)
    readStream.once('error', onError)

    function handleSuccess(): void {
      readStream.removeListener('error', handleError)
      resolve(readStream)
    }

    function handleError(error: Error): void {
      clearTimeout(scheduledResolve)
      reject(error)
    }
  })
}
