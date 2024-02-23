import { UseQueryResult } from 'react-query'

import {
  useAllSessionsQuery,
  useEstopQuery,
  useCurrentAllSubsystemUpdatesQuery,
} from '@opentrons/react-api-client'

import {
  DISENGAGED,
  NOT_PRESENT,
  PHYSICALLY_ENGAGED,
} from '../../../EmergencyStop'
import { useIsRobotBusy } from '../useIsRobotBusy'
import { useIsFlex } from '../useIsFlex'
import { useNotifyCurrentMaintenanceRun } from '../../../../resources/maintenance_runs/useNotifyCurrentMaintenanceRun'
import { useNotifyAllRunsQuery } from '../../../../resources/runs/useNotifyAllRunsQuery'

import type { Sessions, Runs } from '@opentrons/api-client'
import type { AxiosError } from 'axios'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../ProtocolUpload/hooks')
jest.mock('../useIsFlex')
jest.mock('../../../../resources/runs/useNotifyAllRunsQuery')
jest.mock(
  '../../../../resources/maintenance_runs/useNotifyCurrentMaintenanceRun'
)

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
const mockUseNotifyAllRunsQuery = useNotifyAllRunsQuery as jest.MockedFunction<
  typeof useNotifyAllRunsQuery
>
const mockUseNotifyCurrentMaintenanceRun = useNotifyCurrentMaintenanceRun as jest.MockedFunction<
  typeof useNotifyCurrentMaintenanceRun
>
const mockUseEstopQuery = useEstopQuery as jest.MockedFunction<
  typeof useEstopQuery
>
const mockUseCurrentAllSubsystemUpdatesQuery = useCurrentAllSubsystemUpdatesQuery as jest.MockedFunction<
  typeof useCurrentAllSubsystemUpdatesQuery
>
const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>

describe('useIsRobotBusy', () => {
  beforeEach(() => {
    mockUseAllSessionsQuery.mockReturnValue({
      data: {},
    } as UseQueryResult<Sessions, Error>)
    mockUseNotifyAllRunsQuery.mockReturnValue({
      data: {
        links: {
          current: {},
        },
      },
    } as UseQueryResult<Runs, AxiosError>)
    mockUseNotifyCurrentMaintenanceRun.mockReturnValue({
      data: {},
    } as any)
    mockUseEstopQuery.mockReturnValue({ data: mockEstopStatus } as any)
    mockUseCurrentAllSubsystemUpdatesQuery.mockReturnValue({
      data: {
        data: [
          {
            id: '123',
            createdAt: 'today',
            subsystem: 'pipette_right',
            updateStatus: 'done',
          },
        ],
      },
    } as any)
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
    mockUseNotifyAllRunsQuery.mockReturnValue({
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
    mockUseNotifyAllRunsQuery.mockReturnValue({
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
    mockUseNotifyAllRunsQuery.mockReturnValue({
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
    mockUseNotifyAllRunsQuery.mockReturnValue({
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
    mockUseNotifyCurrentMaintenanceRun.mockReturnValue({
      data: {
        data: {
          id: '123',
        },
      },
    } as any)
    const result = useIsRobotBusy()
    expect(result).toBe(true)
  })
  it('returns true when a subsystem update is in progress', () => {
    mockUseCurrentAllSubsystemUpdatesQuery.mockReturnValue({
      data: {
        data: [
          {
            id: '123',
            createdAt: 'today',
            subsystem: 'pipette_right',
            updateStatus: 'updating',
          },
        ],
      },
    } as any)
    const result = useIsRobotBusy()
    expect(result).toBe(true)
  })
})
