// @flow
// fixtures for /wifi/configure

import { POST } from '../../robot-api'
import type { ResponseFixtures } from '../../robot-api/__fixtures__'
import {
  makeResponseFixtures,
  mockFailureBody,
} from '../../robot-api/__fixtures__'
import { WIFI_CONFIGURE_PATH } from '../constants'
import type { WifiConfigureResponse } from '../types'

const {
  successMeta,
  failureMeta,
  success,
  failure,
}: ResponseFixtures<
  WifiConfigureResponse,
  {| message: string |}
> = makeResponseFixtures({
  method: POST,
  path: WIFI_CONFIGURE_PATH,
  successStatus: 200,
  successBody: { ssid: 'network-name', message: 'connected' },
  failureStatus: 500,
  failureBody: mockFailureBody,
})

export {
  successMeta as mockWifiConfigureSuccessMeta,
  failureMeta as mockWifiConfigureFailureMeta,
  success as mockWifiConfigureSuccess,
  failure as mockWifiConfigureFailure,
}
