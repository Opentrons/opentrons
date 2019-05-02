// @flow
// simple fetch wrapper to format URL for robot and parse JSON response
import { of as observableOf } from 'rxjs'
import { fromFetch } from 'rxjs/fetch'
import { timeout, switchMap, catchError } from 'rxjs/operators'

import type { Observable } from 'rxjs'
import type { ApiRequest, ApiResponse } from './types'

const DEFAULT_TIMEOUT_MS = 30000

export default function fetchWrapper(
  call: ApiRequest,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Observable<ApiResponse> {
  const { host, path, method, body: reqBody } = call
  const url = `http://${host.ip}:${host.port}${path}`
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
      observableOf({
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
