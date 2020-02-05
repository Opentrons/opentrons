// @flow
// fixtures for /networking/status

import { GET } from '../../robot-api'
import {
  makeResponseFixtures,
  mockFailureBody,
} from '../../robot-api/__fixtures__'

import type { NetworkingStatusResponse } from '../types'

// Fetch networking status fixtures

export const mockNetworkingStatus: NetworkingStatusResponse = {
  status: 'full',
  interfaces: {
    wlan0: {
      ipAddress: '192.168.43.97/24',
      macAddress: 'B8:27:EB:6C:95:CF',
      gatewayAddress: '192.168.43.161',
      state: 'connected',
      type: 'wifi',
    },
    eth0: {
      ipAddress: '169.254.229.173/16',
      macAddress: 'B8:27:EB:39:C0:9A',
      gatewayAddress: null,
      state: 'connected',
      type: 'ethernet',
    },
  },
}

const { successMeta, failureMeta, success, failure } = makeResponseFixtures<
  NetworkingStatusResponse,
  {| message: string |}
>({
  method: GET,
  path: '/networking/status',
  successStatus: 200,
  successBody: mockNetworkingStatus,
  failureStatus: 500,
  failureBody: mockFailureBody,
})

export {
  successMeta as mockNetworkingStatusSuccessMeta,
  failureMeta as mockNetworkingStatusFailureMeta,
  success as mockNetworkingStatusSuccess,
  failure as mockNetworkingStatusFailure,
}
