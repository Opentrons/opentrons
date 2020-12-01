// @flow
// fetch wrapper to throw if response is not ok
import fs from 'fs'
import { Transform, Readable } from 'stream'
import pump from 'pump'
import _fetch from 'node-fetch'
import FormData from 'form-data'

import { HTTP_API_VERSION } from '@opentrons/app/src/robot-api/constants'

import type { Request, RequestInit, Response } from 'node-fetch'

type RequestInput = Request | string

export type DownloadProgress = {| downloaded: number, size: number | null |}

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

export function fetchJson<Body>(input: RequestInput): Promise<Body> {
  return fetch(input).then(response => response.json())
}

export function fetchText(input: Request): Promise<string> {
  return fetch(input).then(response => response.text())
}

// TODO(mc, 2019-07-02): break this function up and test its components
export function fetchToFile(
  input: RequestInput,
  destination: string,
  options?: $Shape<{ onProgress: (progress: DownloadProgress) => mixed }>
): Promise<string> {
  return fetch(input).then(response => {
    let downloaded = 0
    const size = Number(response.headers.get('Content-Length')) || null

    // with node-fetch, response.body will be a Node.js readable stream
    // rather than a browser-land ReadableStream
    const inputStream: Readable = (response.body: any)
    const outputStream = fs.createWriteStream(destination)

    // pass-through stream to report read progress
    const onProgress = options?.onProgress
    const progressReader = new Transform({
      transform(chunk, encoding, next) {
        downloaded += chunk.length
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
        if (error) return reject(error)
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
  return createReadStream(source).then(readStream => {
    const body = new FormData()
    body.append(name, readStream)
    return fetch(input, { body, method: 'POST' })
  })
}

// create a read stream, handling errors that `fetch` is unable to catch
function createReadStream(source: string): Promise<Readable> {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(source)
    const scheduledResolve = setTimeout(handleSuccess, 0)

    readStream.once('error', handleError)

    function handleSuccess() {
      readStream.removeListener('error', handleError)
      resolve(readStream)
    }

    function handleError(error: Error) {
      clearTimeout(scheduledResolve)
      reject(error)
    }
  })
}
