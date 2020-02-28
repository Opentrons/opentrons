// @flow
// fixtures for /wifi/list

import { GET } from '../../robot-api'
import {
  makeResponseFixtures,
  mockFailureBody,
} from '../../robot-api/__fixtures__'
import { WIFI_LIST_PATH, SECURITY_WPA_EAP } from '../constants'

import type { WifiNetwork, WifiListResponse } from '../types'

export const mockWifiNetwork: WifiNetwork = {
  ssid: 'linksys',
  signal: 50,
  active: false,
  security: 'WPA2 802.1X',
  securityType: SECURITY_WPA_EAP,
}

export const mockWifiList = { list: [mockWifiNetwork] }

const { successMeta, failureMeta, success, failure } = makeResponseFixtures<
  WifiListResponse,
  {| message: string |}
>({
  method: GET,
  path: WIFI_LIST_PATH,
  successStatus: 200,
  successBody: mockWifiList,
  failureStatus: 500,
  failureBody: mockFailureBody,
})

export {
  successMeta as mockWifiListSuccessMeta,
  failureMeta as mockWifiListFailureMeta,
  success as mockWifiListSuccess,
  failure as mockWifiListFailure,
}
