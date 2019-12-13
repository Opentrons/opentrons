// @flow

export type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

// api call + response types

export type RobotHost = {
  name: string,
  ip: string,
  port: number,
}

export type RobotApiRequestOptions = {|
  method: Method,
  path: string,
  body?: mixed,
  query?: { [param: string]: string | boolean | number },
|}

export type RobotApiResponse = {|
  host: RobotHost,
  path: string,
  method: Method,
  body: any,
  status: number,
  ok: boolean,
|}

export type RobotApiRequestMeta = $Shape<{|
  requestId: string,
  response: {|
    method: Method,
    path: string,
    status: number,
    ok: boolean,
  |},
|}>

// API request tracking state

export type RequestState =
  | $ReadOnly<{| status: 'pending' |}>
  | $ReadOnly<{| status: 'success', response: RobotApiResponse |}>
  | $ReadOnly<{|
      status: 'failure',
      response: RobotApiResponse,
      error: { message?: string },
    |}>

export type RobotApiState = $Shape<
  $ReadOnly<{|
    [requestId: string]: void | RequestState,
  |}>
>
