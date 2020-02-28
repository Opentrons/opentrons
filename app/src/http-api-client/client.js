// @flow
// robot HTTP API client

import type { Error } from '../types'
import type { RobotService } from '../robot'
import type { ApiRequestError } from './types'

export type Method = 'GET' | 'POST' | 'PATCH'

// TODO(mc, 2018-04-30): deprecate importing this type from client
export type { ApiRequestError }

// not a real Error or Response so it can be copied across worker boundries
function ResponseError(
  response: Response,
  body: ?{ message: ?string }
): ApiRequestError {
  const { status, statusText, url } = response
  const message = (body && body.message) || `${status} ${statusText}`

  return {
    name: 'ResponseError',
    message,
    status,
    statusText,
    url,
  }
}

// not a real Error so it can be copied across worker boundaries
export function FetchError(error: Error): ApiRequestError {
  return { name: error.name, message: error.message }
}

const JSON_CONTENT_TYPE = 'application/json'

export function client<T, U>(
  robot: RobotService,
  method: Method,
  path: string,
  body?: T
): Promise<U> {
  const url = `http://${robot.ip}:${robot.port}/${path}`
  const options = {
    method,
    headers: {},
    // to make flow happy...
    body: undefined,
  }

  if (body instanceof FormData) {
    options.body = body
  } else if (body) {
    options.body = JSON.stringify(body)
    options.headers['Content-Type'] = JSON_CONTENT_TYPE
  }

  return fetch(url, options).then(jsonFromResponse, fetchErrorFromError)
}

function jsonFromResponse<T>(response: Response): Promise<T> {
  return response
    .json()
    .then(
      body =>
        response.ok
          ? (body: T)
          : Promise.reject(
              ResponseError(response, (body: ?{ message: ?string }))
            ),
      fetchErrorFromError
    )
}

function fetchErrorFromError(error: Error): Promise<*> {
  return Promise.reject(FetchError(error))
}
