// @flow
// robot HTTP API client

import type {RobotService} from '../robot'

type Method = 'GET'

export type ClientResponseError = {
  name: string,
  message: string,
  url?: string,
  status?: number,
  statusText?: string
}

// not a real Error or Response so it can be copied across worker boundries
function ResponseError (response: Response): ClientResponseError {
  const {status, statusText, url} = response

  return {
    name: 'ResponseError',
    message: `${status} ${statusText}`,
    status,
    statusText,
    url
  }
}

// not a real Error so it can be copied across worker boundries
function FetchError (error: Error): ClientResponseError {
  return {name: error.name, message: error.message}
}

const HEADERS = {
  'Content-Type': 'application/json'
}

export default function client (
  robot: RobotService,
  method: Method,
  path: string,
  body?: {}
): Promise<{}> {
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

function jsonFromResponse (response: Response): Promise<{}> {
  if (!response.ok) {
    return Promise.reject(ResponseError(response))
  }

  return response.json().catch(fetchErrorFromError)
}

function fetchErrorFromError (error: Error): Promise<{}> {
  return Promise.reject(FetchError(error))
}
