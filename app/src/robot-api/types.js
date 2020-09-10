// @flow
import typeof { PENDING, SUCCESS, FAILURE } from './constants'

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// api call + response types

export type RobotHost = {
  name: string,
  ip: string,
  port: number,
  ...
}

export type RobotApiRequestOptions = {|
  method: Method,
  path: string,
  body?: { ... },
  query?: { [param: string]: string | boolean | number | null | void, ... },
  form?: FormData,
|}

export type RobotApiResponseMeta = {|
  path: string,
  method: Method,
  status: number,
  ok: boolean,
|}

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

// parameterized response type
// DataT parameter must be a subtype of RobotApiV2ResponseData
// MetaT defaults to void if unspecified
export type ResourceLink = {|
  href: string,
  meta?: $Shape<{| [string]: string | void |}>,
|}

export type ResourceLinks = $Shape<{| [string]: ResourceLink | string | void |}>

// generic response data supertype
export type RobotApiV2ResponseData = {|
  id: string,
  // the "+" means that these properties are covariant, so
  // "extending" types may specify more strict subtypes
  +type: string,
  +attributes: { ... },
|}

export type RobotApiV2ResponseBody<
  DataT: RobotApiV2ResponseData | $ReadOnlyArray<RobotApiV2ResponseData>,
  MetaT = void
> = {|
  data: DataT,
  links?: ResourceLinks,
  meta?: MetaT,
|}

export type RobotApiV2Error = {|
  id?: string,
  links?: ResourceLinks,
  status?: string,
  title?: string,
  detail?: string,
  source?: {|
    pointer?: string,
    parameter?: string,
  |},
  meta?: { ... },
|}

export type RobotApiV2ErrorResponseBody = {|
  errors: Array<RobotApiV2Error>,
|}

// API request tracking state

export type RequestStatus = PENDING | SUCCESS | FAILURE

export type RequestState =
  | $ReadOnly<{| status: PENDING |}>
  | $ReadOnly<{| status: SUCCESS, response: RobotApiResponseMeta |}>
  | $ReadOnly<{|
      status: FAILURE,
      response: RobotApiResponseMeta,
      error: {| message?: string |} | RobotApiV2ErrorResponseBody,
    |}>

export type RobotApiState = $Shape<
  $ReadOnly<{|
    [requestId: string]: void | RequestState,
  |}>
>
