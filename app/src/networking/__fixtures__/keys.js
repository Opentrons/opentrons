// @flow
// fixtures for /wifi/keys

import { GET, POST } from '../../robot-api'
import {
  makeResponseFixtures,
  mockFailureBody,
} from '../../robot-api/__fixtures__'

import { WIFI_KEYS_PATH } from '../constants'

import type { FetchWifiKeysResponse, PostWifiKeysResponse } from '../types'

export const mockWifiKey = {
  id: '123',
  uri: '/wifi/keys/123',
  name: 'key.crt',
}

export const {
  successMeta: mockFetchWifiKeysSuccessMeta,
  failureMeta: mockFetchWifiKeysFailureMeta,
  success: mockFetchWifiKeysSuccess,
  failure: mockFetchWifiKeysFailure,
} = makeResponseFixtures<FetchWifiKeysResponse, {| message: string |}>({
  method: GET,
  path: WIFI_KEYS_PATH,
  successStatus: 200,
  successBody: { keys: [mockWifiKey] },
  failureStatus: 500,
  failureBody: mockFailureBody,
})

export const {
  successMeta: mockPostWifiKeysSuccessMeta,
  failureMeta: mockPostWifiKeysFailureMeta,
  success: mockPostWifiKeysSuccess,
  failure: mockPostWifiKeysFailure,
} = makeResponseFixtures<PostWifiKeysResponse, {| message: string |}>({
  method: POST,
  path: WIFI_KEYS_PATH,
  successStatus: 201,
  successBody: { ...mockWifiKey, message: 'key created' },
  failureStatus: 500,
  failureBody: mockFailureBody,
})
