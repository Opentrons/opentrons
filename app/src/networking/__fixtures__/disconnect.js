// @flow
// fixtures for /wifi/disconnect

import { POST } from '../../robot-api'
import {
  makeResponseFixtures,
  mockFailureBody,
} from '../../robot-api/__fixtures__'

import type { NetworkingDisconnectResponse } from '../types'

export const mockNetworkingDisconnect: NetworkingDisconnectResponse = {
  ssid: 'network-name',
}

const { successMeta, failureMeta, success, failure } = makeResponseFixtures<
  NetworkingDisconnectResponse,
  {| message: string |}
>({
  method: POST,
  path: '/wifi/disconnect',
  successStatus: 200,
  successBody: mockNetworkingDisconnect,
  failureStatus: 500,
  failureBody: mockFailureBody,
})

export {
  successMeta as mockNetworkingDisconnectSuccessMeta,
  failureMeta as mockNetworkingDisconnectFailureMeta,
  success as mockNetworkingDisconnectSuccess,
  failure as mockNetworkingDisconnectFailure,
}
