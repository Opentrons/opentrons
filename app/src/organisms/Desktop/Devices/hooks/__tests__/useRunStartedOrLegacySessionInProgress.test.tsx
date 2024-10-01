import { useAllSessionsQuery } from '@opentrons/react-api-client'
import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'
import { vi, it, expect, describe, beforeEach, afterEach } from 'vitest'

import { useCurrentRunId, useRunStatus } from '/app/resources/runs'
import { useRunStartedOrLegacySessionInProgress } from '..'

import type { UseQueryResult } from 'react-query'
import type { Sessions } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/resources/runs')

describe('useRunStartedOrLegacySessionInProgress', () => {
  beforeEach(() => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_RUNNING)
    vi.mocked(useCurrentRunId).mockReturnValue('123')
    vi.mocked(useAllSessionsQuery).mockReturnValue(({
      data: [],
      links: null,
    } as unknown) as UseQueryResult<Sessions, Error>)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns true when current run status is not idle or sessions are empty', () => {
    const result = useRunStartedOrLegacySessionInProgress()
    expect(result).toBe(true)
  })

  it('returns false when run status is idle or sessions are not empty', () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_IDLE)
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
    const result = useRunStartedOrLegacySessionInProgress()
    expect(result).toBe(false)
  })
})
