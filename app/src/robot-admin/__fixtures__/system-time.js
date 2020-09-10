// @flow
import { GET } from '../../robot-api'
import { SYSTEM_TIME_PATH } from '../constants'
import {
  makeResponseFixtures,
  mockFailureBody,
} from '../../robot-api/__fixtures__'

import type { SystemTimeData, SystemTimeAttributes } from '../api-types'
import type { ResponseFixtures } from '../../robot-api/__fixtures__'

export const mockSystemTimeAttributes: SystemTimeAttributes = {
  systemTime: '2020-09-08T18:02:01.318292+00:00',
}

export const {
  successMeta: mockFetchSystemTimeSuccessMeta,
  failureMeta: mockFetchSystemTimeFailureMeta,
  success: mockFetchSystemTimeSuccess,
  failure: mockFetchSystemTimeFailure,
}: ResponseFixtures<
  SystemTimeData,
  {| message: string |}
> = makeResponseFixtures({
  method: GET,
  path: SYSTEM_TIME_PATH,
  successStatus: 200,
  successBody: {
    id: 'time',
    type: 'SystemTimeAttributes',
    attributes: mockSystemTimeAttributes,
  },
  failureStatus: 500,
  failureBody: mockFailureBody,
})
