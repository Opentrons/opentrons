import { UseQueryResult } from 'react-query'
import { useAllSessionsQuery } from '@opentrons/react-api-client'
import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'

import { useCurrentRunId } from '../../../ProtocolUpload/hooks'
import { useRunStatus } from '../../../RunTimeControl/hooks'
import { useRobotBusyAndRunStarted } from '..'

import type { Sessions } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../ProtocolUpload/hooks')
jest.mock('../../../RunTimeControl/hooks')

const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseAllSessionsQuery = useAllSessionsQuery as jest.MockedFunction<
  typeof useAllSessionsQuery
>

describe('useRobotBusyAndRunStarted', () => {
  beforeEach(() => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_RUNNING)
    mockUseCurrentRunId.mockReturnValue('123')
    mockUseAllSessionsQuery.mockReturnValue({
      data: {},
    } as UseQueryResult<Sessions, Error>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns true when current run status is not idle', () => {
    const result = useRobotBusyAndRunStarted()
    expect(result).toBe(true)
  })

  it('returns true when sessions are not empty', () => {
    const result = useRobotBusyAndRunStarted()
    expect(result).toBe(true)
  })

  it('returns false when run status is idle and sessions are empty', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_IDLE)
    mockUseAllSessionsQuery.mockReturnValue(({
      data: [
        {
          id: 'test',
          createdAt: '2019-08-24T14:15:22Z',
          details: {},
          sessionType: 'calibrationCheck',
          createParams: {},
        },
      ],
      links: {},
    } as unknown) as UseQueryResult<Sessions, Error>)
    const result = useRobotBusyAndRunStarted()
    expect(result).toBe(false)
  })
})
