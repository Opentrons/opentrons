import { UseQueryResult } from 'react-query'
import {
  useAllSessionsQuery,
  useAllRunsQuery,
  useEstopQuery,
  useCurrentMaintenanceRun,
} from '@opentrons/react-api-client'
import {
  DISENGAGED,
  NOT_PRESENT,
  PHYSICALLY_ENGAGED,
} from '../../../EmergencyStop'

import { useIsRobotBusy } from '../useIsRobotBusy'
import { useIsFlex } from '../useIsFlex'

import type { Sessions, Runs } from '@opentrons/api-client'
import type { AxiosError } from 'axios'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../ProtocolUpload/hooks')
jest.mock('../useIsFlex')

const mockEstopStatus = {
  data: {
    status: DISENGAGED,
    leftEstopPhysicalStatus: DISENGAGED,
    rightEstopPhysicalStatus: NOT_PRESENT,
  },
}

const mockUseAllSessionsQuery = useAllSessionsQuery as jest.MockedFunction<
  typeof useAllSessionsQuery
>
const mockUseAllRunsQuery = useAllRunsQuery as jest.MockedFunction<
  typeof useAllRunsQuery
>
const mockUseCurrentMaintenanceRun = useCurrentMaintenanceRun as jest.MockedFunction<
  typeof useCurrentMaintenanceRun
>
const mockUseEstopQuery = useEstopQuery as jest.MockedFunction<
  typeof useEstopQuery
>
const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>

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
    } as UseQueryResult<Runs, AxiosError>)
    mockUseCurrentMaintenanceRun.mockReturnValue({
      data: {},
    } as any)
    mockUseEstopQuery.mockReturnValue({ data: mockEstopStatus } as any)
    mockUseIsFlex.mockReturnValue(false)
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

  it('returns false when Estop status is disengaged', () => {
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

  it('returns true when robot is a Flex and Estop status is engaged', () => {
    mockUseIsFlex.mockReturnValue(true)
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
    const mockEngagedStatus = {
      data: {
        ...mockEstopStatus.data,
        status: PHYSICALLY_ENGAGED,
      },
    }
    mockUseEstopQuery.mockReturnValue({ data: mockEngagedStatus } as any)
    const result = useIsRobotBusy()
    expect(result).toBe(true)
  })
  it('returns false when robot is NOT a Flex and Estop status is engaged', () => {
    mockUseIsFlex.mockReturnValue(false)
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
    const mockEngagedStatus = {
      data: {
        ...mockEstopStatus.data,
        status: PHYSICALLY_ENGAGED,
      },
    }
    mockUseEstopQuery.mockReturnValue({ data: mockEngagedStatus } as any)
    const result = useIsRobotBusy()
    expect(result).toBe(false)
  })

  it('returns true when a maintenance run exists', () => {
    mockUseCurrentMaintenanceRun.mockReturnValue({
      data: {
        data: {
          id: '123',
        },
      },
    } as any)
    const result = useIsRobotBusy()
    expect(result).toBe(true)
  })
})
