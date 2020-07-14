// @flow
// simple fetch wrapper to format URL for robot and parse JSON response
import { of, from } from 'rxjs'
import { map, switchMap, catchError } from 'rxjs/operators'
import mapValues from 'lodash/mapValues'
import toString from 'lodash/toString'
import omitBy from 'lodash/omitBy'

import type { Observable } from 'rxjs'
import type {
  RobotHost,
  RobotApiRequestOptions,
  RobotApiResponse,
} from './types'

function checkEmpty(value) {
  return value == null || value === ''
}

export function robotApiUrl(
  host: RobotHost,
  request: RobotApiRequestOptions
): string {
  const { path, query } = request
  let url = `http://${host.ip}:${host.port}${path}`

  if (query && Object.keys(query).length > 0) {
    const queryNoEmptyParams = omitBy(query, checkEmpty)
    const stringParamsMap = mapValues(queryNoEmptyParams, toString)
    const queryParams = new URLSearchParams(stringParamsMap)
    url += `?${queryParams.toString()}`
  }

  return url
}

export function fetchRobotApi(
  host: RobotHost,
  request: RobotApiRequestOptions
): Observable<RobotApiResponse> {
  const { path, method, body: reqBody, form: reqForm } = request
  const url = robotApiUrl(host, request)
  const options: RequestOptions = { method }

  if (reqBody != null) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(reqBody)
  } else if (reqForm != null) {
    options.body = reqForm
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
