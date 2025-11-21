import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'
import { useAllSessionsQuery } from '@opentrons/react-api-client'

import { useCurrentRunId, useNotifyRunQuery } from '/app/resources/runs'

import { useRunStartedOrLegacySessionInProgress } from '..'

import type { UseQueryResult } from 'react-query'
import type { Run, Sessions } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/resources/runs')

const runningRun = {
  current: false,
  id: 'test_id_running',
  status: RUN_STATUS_RUNNING,
}

const idleRun = {
  current: true,
  id: 'test_id_idle',
  status: RUN_STATUS_IDLE,
}

describe('useRunStartedOrLegacySessionInProgress', () => {
  beforeEach(() => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith('test_id_running')
      .thenReturn({ data: { data: runningRun } } as UseQueryResult<
        Run,
        unknown
      >)
    vi.mocked(useCurrentRunId).mockReturnValue('test_id_running')
    vi.mocked(useAllSessionsQuery).mockReturnValue({
      data: [],
      links: null,
    } as unknown as UseQueryResult<Sessions, Error>)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns true when current run status is not idle or sessions are empty', () => {
    const result = useRunStartedOrLegacySessionInProgress()
    expect(result).toBe(true)
  })

  it('returns false when run status is idle or sessions are not empty', () => {
    when(vi.mocked(useNotifyRunQuery))
      .calledWith('test_id_idle')
      .thenReturn({ data: { data: idleRun } } as UseQueryResult<Run, unknown>)
    vi.mocked(useCurrentRunId).mockReturnValue('test_id_idle')
    vi.mocked(useAllSessionsQuery).mockReturnValue({
      data: [
        {
          id: 'test_id_idle',
          createdAt: '2019-08-24T14:15:22Z',
          details: {},
          sessionType: 'calibrationCheck',
          createParams: {},
          status: RUN_STATUS_IDLE,
        },
      ],
      links: {},
    } as unknown as UseQueryResult<Sessions, Error>)
    const result = useRunStartedOrLegacySessionInProgress()
    expect(result).toBe(false)
  })
})
