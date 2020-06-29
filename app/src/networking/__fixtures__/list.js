// @flow
// fixtures for /wifi/list

import { GET } from '../../robot-api'
import type { ResponseFixtures } from '../../robot-api/__fixtures__'
import {
  makeResponseFixtures,
  mockFailureBody,
} from '../../robot-api/__fixtures__'
import { SECURITY_WPA_EAP, WIFI_LIST_PATH } from '../constants'
import type { WifiListResponse, WifiNetwork } from '../types'

export const mockWifiNetwork: WifiNetwork = {
  ssid: 'linksys',
  signal: 50,
  active: false,
  security: 'WPA2 802.1X',
  securityType: SECURITY_WPA_EAP,
}

export const mockWifiList = { list: [mockWifiNetwork] }

const {
  successMeta,
  failureMeta,
  success,
  failure,
}: ResponseFixtures<
  WifiListResponse,
  {| message: string |}
> = makeResponseFixtures({
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
