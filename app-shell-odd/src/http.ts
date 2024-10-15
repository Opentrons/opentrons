// fetch wrapper to throw if response is not ok
import fs from 'fs'
import { remove } from 'fs-extra'
import pump from 'pump'
import _fetch from 'node-fetch'
import FormData from 'form-data'
import { Transform } from 'stream'

import { HTTP_API_VERSION } from './constants'
import { createLogger } from './log'

import type { Readable } from 'stream'
import type { Request, RequestInit, Response } from 'node-fetch'

const log = createLogger('http')

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
  signal: AbortSignal
}

// TODO(mc, 2019-07-02): break this function up and test its components
export function fetchToFile(
  input: RequestInput,
  destination: string,
  options?: Partial<FetchToFileOptions>
): Promise<string> {
  return fetch(input, { signal: options?.signal }).then(response => {
    let downloaded = 0
    const size = Number(response.headers.get('Content-Length')) || null

    // with node-fetch, response.body will be a Node.js readable stream
    // rather than a browser-land ReadableStream
    const inputStream = response.body
    const outputStream = fs.createWriteStream(destination)

    // pass-through stream to report read progress
    const onProgress = options?.onProgress
    const progressReader = new Transform({
      transform(chunk: string | Buffer, encoding, next) {
        downloaded += chunk.length
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
          // if we error out, delete the temp dir to clean up
          log.error(`Aborting fetchToFile: ${problem.name}: ${problem.message}`)
          remove(destination).then(() => {
            reject(error)
          })
        }
        const listener = (): void => {
          handleError(
            new LocalAbortError(
              (options?.signal?.reason as string | null) ?? 'aborted'
            )
          )
        }
        options?.signal?.addEventListener('abort', listener, { once: true })
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (error) {
          handleError(error)
        }
        options?.signal?.removeEventListener('abort', listener, {})
        resolve(destination)
      })
    })
  })
}

export function postFile(
  input: RequestInput,
  name: string,
  source: string
): Promise<Response> {
  return new Promise<Response>((resolve, reject) => {
    createReadStream(source, reject).then(readStream =>
      new Promise<Response>(resolve => {
        const body = new FormData()
        body.append(name, readStream)
        resolve(fetch(input, { body, method: 'POST' }))
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
