import {
  useAllSessionsQuery,
  useCurrentAllSubsystemUpdatesQuery,
  useEstopQuery,
} from '@opentrons/react-api-client'
import { vi, it, expect, describe, beforeEach, afterEach } from 'vitest'

import { useIsRobotBusy } from '../useIsRobotBusy'
import { useIsFlex } from '/app/redux-resources/robots'
import { useNotifyCurrentMaintenanceRun } from '/app/resources/maintenance_runs'
import { useNotifyAllRunsQuery } from '/app/resources/runs'

import type { UseQueryResult } from 'react-query'
import type { Sessions, Runs } from '@opentrons/api-client'
import type { AxiosError } from 'axios'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/resources/runs')
vi.mock('/app/resources/maintenance_runs')

const mockEstopStatus = {
  data: {
    status: 'disengaged',
    leftEstopPhysicalStatus: 'disengaged',
    rightEstopPhysicalStatus: 'notPresent',
  },
}

describe('useIsRobotBusy', () => {
  beforeEach(() => {
    vi.mocked(useAllSessionsQuery).mockReturnValue({
      data: {},
    } as UseQueryResult<Sessions, Error>)
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: {
        links: {
          current: {},
        },
      },
    } as UseQueryResult<Runs, AxiosError>)
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: {},
    } as any)
    vi.mocked(useEstopQuery).mockReturnValue({ data: mockEstopStatus } as any)
    vi.mocked(useIsFlex).mockReturnValue(false)
    vi.mocked(useCurrentAllSubsystemUpdatesQuery).mockReturnValue({
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
  })

  afterEach(() => {
    vi.resetAllMocks()
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
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: {
        links: {
          current: null,
        },
      },
    } as any)
    vi.mocked(useAllSessionsQuery).mockReturnValue(({
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
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: {
        links: {
          current: null,
        },
      },
    } as any)
    vi.mocked(useAllSessionsQuery).mockReturnValue(({
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
    vi.mocked(useIsFlex).mockReturnValue(true)
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: {
        links: {
          current: null,
        },
      },
    } as any)
    vi.mocked(useAllSessionsQuery).mockReturnValue(({
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
        status: 'physicallyEngaged',
      },
    }
    vi.mocked(useEstopQuery).mockReturnValue({ data: mockEngagedStatus } as any)
    const result = useIsRobotBusy()
    expect(result).toBe(true)
  })
  it('returns false when robot is NOT a Flex and Estop status is engaged', () => {
    vi.mocked(useIsFlex).mockReturnValue(false)
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: {
        links: {
          current: null,
        },
      },
    } as any)
    vi.mocked(useAllSessionsQuery).mockReturnValue(({
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
        status: 'physicallyEngaged',
      },
    }
    vi.mocked(useEstopQuery).mockReturnValue({ data: mockEngagedStatus } as any)
    const result = useIsRobotBusy()
    expect(result).toBe(false)
  })

  it('returns true when a maintenance run exists', () => {
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
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
    vi.mocked(useCurrentAllSubsystemUpdatesQuery).mockReturnValue({
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
