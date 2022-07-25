import { UseQueryResult } from 'react-query'
import { useAllSessionsQuery } from '@opentrons/react-api-client'
import {
  RUN_STATUS_FAILED,
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'

import { useCurrentRunId } from '../../../ProtocolUpload/hooks'
import { useRunStatus } from '../../../RunTimeControl/hooks'
import { useRunStatuses } from '..'

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
describe(' useRunStatuses ', () => {
  beforeEach(() => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_RUNNING)
    mockUseCurrentRunId.mockReturnValue('123')
    mockUseAllSessionsQuery.mockReturnValue(({
      data: [],
      links: null,
    } as unknown) as UseQueryResult<Sessions, Error>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns everything as false when run status is null and sessions are empty', () => {
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isLegacySessionInProgress: false,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it('returns  true isLegacySessionInProgress and true isRunStill and Terminal when run status is suceeded and sessions are not empty', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_SUCCEEDED)
    mockUseAllSessionsQuery.mockReturnValue(({
      data: {
        data: {
          id: 'id',
          sessionType: 'calibrationCheck',
          createParams: 'params',
        },
      },
      links: {},
    } as unknown) as UseQueryResult<Sessions, Error>)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isLegacySessionInProgress: true,
      isRunStill: true,
      isRunTerminal: true,
      isRunIdle: false,
    })
  })

  it('returns true isLegacySessionInProgress and true isRunStill and Terminal when run status is stopped and sessions are not empty', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_STOPPED)
    mockUseAllSessionsQuery.mockReturnValue(({
      data: {
        data: {
          id: 'id',
          sessionType: 'calibrationCheck',
          createParams: 'params',
        },
      },
      links: {},
    } as unknown) as UseQueryResult<Sessions, Error>)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isLegacySessionInProgress: true,
      isRunStill: true,
      isRunTerminal: true,
      isRunIdle: false,
    })
  })

  it('returns true  isLegacySesionInprogress and true isRunStill and Terminal when run status is failed and sessions are not empty', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_FAILED)
    mockUseAllSessionsQuery.mockReturnValue(({
      data: {
        data: {
          id: 'id',
          sessionType: 'calibrationCheck',
          createParams: 'params',
        },
      },
      links: {},
    } as unknown) as UseQueryResult<Sessions, Error>)

    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isLegacySessionInProgress: true,
      isRunStill: true,
      isRunTerminal: true,
      isRunIdle: false,
    })
  })

  it('returns false isLegacySessionInprogress and true isRunStill and isRunIdle when run status is idle and sessions are empty', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_IDLE)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isLegacySessionInProgress: false,
      isRunStill: true,
      isRunTerminal: false,
      isRunIdle: true,
    })
  })
})
