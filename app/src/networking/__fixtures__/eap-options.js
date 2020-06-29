// @flow
// fixtures for /wifi/eap-options

import { GET } from '../../robot-api'
import type { ResponseFixtures } from '../../robot-api/__fixtures__'
import {
  makeResponseFixtures,
  mockFailureBody,
} from '../../robot-api/__fixtures__'
import {
  AUTH_TYPE_FILE,
  AUTH_TYPE_PASSWORD,
  AUTH_TYPE_STRING,
  EAP_OPTIONS_PATH,
} from '../constants'
import type {
  EapOption,
  FetchEapOptionsResponse,
  WifiAuthField,
} from '../types'

export const mockEapStringField: WifiAuthField = {
  name: 'stringField',
  displayName: 'String Field',
  required: true,
  type: AUTH_TYPE_STRING,
}

export const mockEapPasswordField: WifiAuthField = {
  name: 'passwordField',
  displayName: 'Password Field',
  required: false,
  type: AUTH_TYPE_PASSWORD,
}

export const mockEapFileField: WifiAuthField = {
  name: 'fileField',
  displayName: 'File Field',
  required: true,
  type: AUTH_TYPE_FILE,
}

export const mockEapOption: EapOption = {
  name: 'eapOption',
  displayName: 'EAP Option',
  options: [mockEapStringField, mockEapPasswordField, mockEapFileField],
}

const {
  successMeta,
  failureMeta,
  success,
  failure,
}: ResponseFixtures<
  FetchEapOptionsResponse,
  {| message: string |}
> = makeResponseFixtures({
  method: GET,
  path: EAP_OPTIONS_PATH,
  successStatus: 200,
  successBody: { options: [mockEapOption] },
  failureStatus: 500,
  failureBody: mockFailureBody,
})

export {
  successMeta as mockFetchEapOptionsSuccessMeta,
  failureMeta as mockFetchEapOptionsFailureMeta,
  success as mockFetchEapOptionsSuccess,
  failure as mockFetchEapOptionsFailure,
}
