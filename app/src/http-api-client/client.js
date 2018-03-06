// @flow
// robot HTTP API client

import type {RobotService} from '../robot'

type Method = 'GET' | 'POST'

export type ApiRequestError = {
  name: string,
  message: string,
  url?: string,
  status?: number,
  statusText?: string,
}

// not a real Error or Response so it can be copied across worker boundries
function ResponseError (
  response: Response,
  body: ?{message: ?string}
): ApiRequestError {
  const {status, statusText, url} = response
  const message = (body && body.message) || `${status} ${statusText}`

  return {
    name: 'ResponseError',
    message,
    status,
    statusText,
    url
  }
}

// not a real Error so it can be copied across worker boundries
function FetchError (error: Error): ApiRequestError {
  return {name: error.name, message: error.message}
}

const HEADERS = {
  'Content-Type': 'application/json'
}

export default function client<T, U> (
  robot: RobotService,
  method: Method,
  path: string,
  body?: T
): Promise<U> {
  const url = `http://${robot.ip}:${robot.port}/${path}`
  const options = {
    method,
    headers: HEADERS,
    body: (body && method !== 'GET')
      ? JSON.stringify(body)
      : undefined
  }

  return fetch(url, options).then(jsonFromResponse, fetchErrorFromError)
}

function jsonFromResponse<T> (response: Response): Promise<T> {
  return response.json()
    .then(
      (body) => response.ok
        ? (body: T)
        : Promise.reject(ResponseError(response, (body: ?{message: ?string}))),
      fetchErrorFromError
    )
}

function fetchErrorFromError (error: Error): Promise<*> {
  return Promise.reject(FetchError(error))
}
