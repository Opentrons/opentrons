import { PENDING, SUCCESS, FAILURE } from './constants'

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// api call + response types

export interface RobotHost {
  name: string
  ip: string
  port: number
  [key: string]: unknown
}

export interface RobotApiRequestOptions {
  method: Method
  path: string
  body?: {}
  query?: {
    [param: string]: string | boolean | number | null | undefined
  }
  form?: FormData
}

export interface RobotApiResponseMeta {
  path: string
  method: Method
  status: number
  ok: boolean
}

export interface RobotApiResponse extends RobotApiResponseMeta {
  host: RobotHost
  body: any
}

export interface RobotApiRequestMeta {
  requestId?: string
  response: {
    method: Method
    path: string
    status: number
    ok: boolean
  }
  [key: string]: unknown
}

export interface RobotApiErrorResponse {
  message: string
  [key: string]: unknown
}

// action types

export interface DismissRequestAction {
  type: 'robotApi:DISMISS_REQUEST'
  payload: { requestId: string }
}

export type RobotApiAction = DismissRequestAction

// parameterized response type
// DataT parameter must be a subtype of RobotApiV2ResponseData
// MetaT defaults to void if unspecified
export interface ResourceLink {
  href: string
  meta?: Partial<{ [key: string]: string | null | undefined }>
}

export type ResourceLinks = Record<
  string,
  ResourceLink | string | null | undefined
>

// generic response data supertype
export type RobotApiV2ResponseData = Partial<{ id: string }>

export interface RobotApiV2ResponseBody<
  DataT extends RobotApiV2ResponseData | RobotApiV2ResponseData[]
> {
  data: DataT
  links?: ResourceLinks
}

export interface RobotApiV2Error {
  id?: string
  links?: ResourceLinks
  status?: string
  title?: string
  detail?: string
  source?: {
    pointer?: string
    parameter?: string
  }
  meta?: {}
}

export interface RobotApiV2ErrorResponseBody {
  errors: RobotApiV2Error[]
}

// API request tracking state

export type RequestStatus = typeof PENDING | typeof SUCCESS | typeof FAILURE

export type RequestState =
  | { status: typeof PENDING }
  | { status: typeof SUCCESS; response: RobotApiResponseMeta }
  | {
      status: typeof FAILURE
      response: RobotApiResponseMeta
      error: { message?: string } | RobotApiV2ErrorResponseBody
    }

export type RobotApiState = Partial<{
  [requestId: string]: null | undefined | RequestState
}>
