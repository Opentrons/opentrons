// @flow
// fixtures for /networking/status

import { GET } from '../../robot-api'
import {
  makeResponseFixtures,
  mockFailureBody,
} from '../../robot-api/__fixtures__'

import type { ResponseFixtures } from '../../robot-api/__fixtures__'
import type { NetworkingStatusResponse } from '../types'

export const mockWifiInterface = {
  ipAddress: '192.168.43.97/24',
  macAddress: 'B8:27:EB:6C:95:CF',
  gatewayAddress: '192.168.43.161',
  state: 'connected',
  type: 'wifi',
}

export const mockEthernetInterface = {
  ipAddress: '169.254.229.173/16',
  macAddress: 'B8:27:EB:39:C0:9A',
  gatewayAddress: null,
  state: 'connected',
  type: 'ethernet',
}

export const mockNetworkingStatus: NetworkingStatusResponse = {
  status: 'full',
  interfaces: {
    wlan0: mockWifiInterface,
    eth0: mockEthernetInterface,
  },
}

const {
  successMeta,
  failureMeta,
  success,
  failure,
}: ResponseFixtures<
  NetworkingStatusResponse,
  {| message: string |}
> = makeResponseFixtures({
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
