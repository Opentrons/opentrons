import { UseQueryResult } from 'react-query'
import {
  useAllSessionsQuery,
  useAllRunsQuery,
} from '@opentrons/react-api-client'

import { useIsRobotBusy } from '../useIsRobotBusy'

import type { Sessions, Runs } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../ProtocolUpload/hooks')

const mockUseAllSessionsQuery = useAllSessionsQuery as jest.MockedFunction<
  typeof useAllSessionsQuery
>
const mockUseAllRunsQuery = useAllRunsQuery as jest.MockedFunction<
  typeof useAllRunsQuery
>

describe('useIsRobotBusy', () => {
  beforeEach(() => {
    mockUseAllSessionsQuery.mockReturnValue({
      data: {},
    } as UseQueryResult<Sessions, Error>)
    mockUseAllRunsQuery.mockReturnValue({
      data: {
        links: {
          current: {},
        },
      },
    } as UseQueryResult<Runs, Error>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns true when current runId is not null', () => {
    const result = useIsRobotBusy({ poll: false })
    expect(result).toBe(true)
  })

  it('returns true when sessions are not empty', () => {
    const result = useIsRobotBusy({ poll: false })
    expect(result).toBe(true)
  })

  it('returns false when current runId is null and sessions are empty', () => {
    mockUseAllRunsQuery.mockReturnValue({
      data: {
        links: {
          current: null,
        },
      },
    } as any)
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
    const result = useIsRobotBusy()
    expect(result).toBe(false)
  })

  // TODO: kj 07/13/2022 This test is temporary pending but should be solved by another PR.
  // it('should poll the run and sessions if poll option is true', async () => {
  //   const result = useIsRobotBusy({ poll: true })
  //   expect(result).toBe(true)

  //   act(() => {
  //     jest.advanceTimersByTime(30000)
  //   })
  //   expect(mockUseAllRunsQuery).toHaveBeenCalled()
  //   expect(mockUseAllSessionsQuery).toHaveBeenCalled()
  // })
})
