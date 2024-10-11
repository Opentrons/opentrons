// simple fetch wrapper to format URL for robot and parse JSON response
import { of, from } from 'rxjs'
import { map, switchMap, catchError } from 'rxjs/operators'
import mapValues from 'lodash/mapValues'
import toString from 'lodash/toString'
import omitBy from 'lodash/omitBy'
import inRange from 'lodash/inRange'
import type { AxiosError } from 'axios'

import { OPENTRONS_USB } from '../discovery'
import { appShellRequestor } from '../shell/remote'
import { HTTP_API_VERSION } from './constants'

import type { Observable } from 'rxjs'
import type {
  RobotHost,
  RobotApiRequestOptions,
  RobotApiResponse,
} from './types'

const checkEmpty = (val: unknown): boolean => val == null || val === ''

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
  const options: RequestInit = {
    method,
    headers: { 'Opentrons-Version': `${HTTP_API_VERSION}` },
  }

  if (reqBody != null) {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
    options.body = JSON.stringify(reqBody)
  } else if (reqForm != null) {
    options.body = reqForm
  }

  return host.ip === OPENTRONS_USB
    ? from(
        appShellRequestor({
          headers: options.headers,
          method,
          url,
          data: options.body,
        })
          .then(response => ({
            isError: false as const,
            response,
          }))
          .catch(err => ({
            isError: true as const,
            ...(err as AxiosError<unknown>),
          }))
      ).pipe(
        map(result => ({
          host,
          path,
          method,
          body: result?.response?.data,
          // FIXME(sf) this doesn't seem right, but also the type interface isn't written to allow for request
          // failures that don't come from valid connections
          status: result?.response?.status ?? 444,
          // appShellRequestor eventually calls axios.request, which doesn't provide an ok boolean in the response
          ok: result.isError
            ? false
            : inRange(result?.response?.status, 200, 300),
        }))
      )
    : from(fetch(url, options)).pipe(
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
