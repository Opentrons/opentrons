// @flow
// generic, robot HTTP API fixtures

import type {
  Method,
  RobotHost,
  RobotApiRequestMeta,
  RobotApiResponseMeta,
  RobotApiV2Error,
  RobotApiV2ErrorResponseBody,
} from '../types'

export type ResponseFixturesOptions<SuccessBody, FailureBody> = {|
  method: Method,
  path: string,
  successStatus: number,
  successBody: SuccessBody,
  failureStatus: number,
  failureBody: FailureBody,
|}

export type ResponseFixtures<SuccessBody, FailureBody> = {|
  successMeta: {| method: Method, path: string, status: number, ok: boolean |},
  failureMeta: {| method: Method, path: string, status: number, ok: boolean |},
  success: {|
    method: Method,
    path: string,
    status: number,
    ok: boolean,
    host: RobotHost,
    body: SuccessBody,
  |},
  failure: {|
    method: Method,
    path: string,
    status: number,
    ok: boolean,
    host: RobotHost,
    body: FailureBody,
  |},
|}

export const mockRobot: RobotHost = {
  name: 'robot',
  ip: '127.0.0.1',
  port: 31950,
}

export const mockRequestMeta: RobotApiRequestMeta = { requestId: 'abc' }

export const mockFailureBody = { message: 'AH' }

export const mockFailedRequestState: {|
  status: 'failure',
  response: RobotApiResponseMeta,
  error: {| message?: string |},
|} = {
  response: {
    path: '/modules/abc123/update',
    method: 'POST',
    status: 500,
    ok: false,
  },
  status: 'failure',
  error: { message: 'went bad' },
}

export const makeResponseFixtures = <SuccessBody, FailureBody>(
  options: ResponseFixturesOptions<SuccessBody, FailureBody>
): ResponseFixtures<SuccessBody, FailureBody> => {
  const {
    method,
    path,
    successStatus,
    successBody,
    failureStatus,
    failureBody,
  } = options
  const commonMeta = { method, path }
  const successMeta = { ...commonMeta, status: successStatus, ok: true }
  const failureMeta = { ...commonMeta, status: failureStatus, ok: false }
  const success = { ...successMeta, host: mockRobot, body: successBody }
  const failure = { ...failureMeta, host: mockRobot, body: failureBody }

  return { successMeta, success, failureMeta, failure }
}

export const mockV2Error: RobotApiV2Error = {
  status: 'went bad',
}

export const mockV2ErrorResponse: RobotApiV2ErrorResponseBody = {
  errors: [mockV2Error],
}
