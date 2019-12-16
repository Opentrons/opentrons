// @flow
// simple fetch wrapper to format URL for robot and parse JSON response
import { of, from } from 'rxjs'
import { map, switchMap, catchError } from 'rxjs/operators'
import mapValues from 'lodash/mapValues'
import toString from 'lodash/toString'

import type { Observable } from 'rxjs'
import type {
  RobotHost,
  RobotApiRequestOptions,
  RobotApiResponse,
} from './types'

export function robotApiUrl(
  host: RobotHost,
  request: RobotApiRequestOptions
): string {
  const { path, query } = request
  let url = `http://${host.ip}:${host.port}${path}`

  if (query && Object.keys(query).length > 0) {
    const stringParamsMap = mapValues(query, toString)
    const queryParams = new URLSearchParams(stringParamsMap)
    url += `?${queryParams.toString()}`
  }

  return url
}

export function fetchRobotApi(
  host: RobotHost,
  request: RobotApiRequestOptions
): Observable<RobotApiResponse> {
  const { path, method, body: reqBody } = request
  const url = robotApiUrl(host, request)
  const options: RequestOptions = { method }

  if (reqBody != null) {
    if (typeof reqBody === 'object') options.body = JSON.stringify(reqBody)
  }

  return from(fetch(url, options)).pipe(
    switchMap(response => {
      return from(response.json()).pipe(
        map(body => ({
          host,
          path,
          method,
          body,
          status: response.status,
          ok: response.ok,
        }))
      )
    }),
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
