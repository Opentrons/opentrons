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
  body?: { ... },
  query?: { [param: string]: string | boolean | number },
  form?: FormData,
|}

export type RobotApiResponseMeta = $Shape<{|
  path: string,
  method: Method,
  status: number,
  ok: boolean,
|}>

export type RobotApiResponse = {|
  ...RobotApiResponseMeta,
  host: RobotHost,
  body: any,
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

export type RobotApiErrorResponse = {
  message: string,
  ...
}

// action types

export type DismissRequestAction = {|
  type: 'robotApi:DISMISS_REQUEST',
  payload: {| requestId: string |},
|}

export type RobotApiAction = DismissRequestAction

// API request tracking state

export type RequestState =
  | $ReadOnly<{| status: 'pending' |}>
  | $ReadOnly<{| status: 'success', response: RobotApiResponseMeta |}>
  | $ReadOnly<{|
      status: 'failure',
      response: RobotApiResponseMeta,
      error: { message?: string },
    |}>

export type RobotApiState = $Shape<
  $ReadOnly<{|
    [requestId: string]: void | RequestState,
  |}>
>
