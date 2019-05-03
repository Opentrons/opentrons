// @flow
// simple fetch wrapper to format URL for robot and parse JSON response
import { of } from 'rxjs'
import { fromFetch } from 'rxjs/fetch'
import { timeout, switchMap, catchError } from 'rxjs/operators'

import type { Observable } from 'rxjs'
import type { RobotApiRequest, RobotApiResponse } from './types'

const DEFAULT_TIMEOUT_MS = 30000

export function robotApiUrl(request: RobotApiRequest): string {
  const { host, path } = request
  return `http://${host.ip}:${host.port}${path}`
}

export function robotApiFetch(
  request: RobotApiRequest,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Observable<RobotApiResponse> {
  const { host, path, method, body: reqBody } = request
  const url = robotApiUrl(request)
  const options: RequestOptions = { method }

  if (reqBody) {
    if (typeof reqBody === 'object') options.body = JSON.stringify(reqBody)
  }

  return fromFetch(url, options).pipe(
    timeout(timeoutMs),
    switchMap(response =>
      response.json().then(body => ({
        host,
        path,
        method,
        body,
        status: response.status,
        ok: response.ok,
      }))
    ),
    catchError(error =>
      of({
        host,
        path,
        method,
        body: { message: error.message },
        status: -1,
        ok: false,
      })
    )
  )
}
