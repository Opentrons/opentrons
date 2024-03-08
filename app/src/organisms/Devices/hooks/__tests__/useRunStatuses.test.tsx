import {
  RUN_STATUS_FAILED,
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import { vi, it, expect, describe, beforeEach, afterEach } from 'vitest'

import { useCurrentRunId } from '../../../ProtocolUpload/hooks'
import { useRunStatus } from '../../../RunTimeControl/hooks'
import { useRunStatuses } from '..'

vi.mock('../../../ProtocolUpload/hooks')
vi.mock('../../../RunTimeControl/hooks')

describe(' useRunStatuses ', () => {
  beforeEach(() => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_RUNNING)
    vi.mocked(useCurrentRunId).mockReturnValue('123')
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns everything as false when run status is null', () => {
    vi.mocked(useRunStatus).mockReturnValue(null)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: false,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it('returns true isRunStill and Terminal when run status is suceeded', () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_SUCCEEDED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: false,
      isRunStill: true,
      isRunTerminal: true,
      isRunIdle: false,
    })
  })

  it('returns true isRunStill and Terminal when run status is stopped', () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_STOPPED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: false,
      isRunStill: true,
      isRunTerminal: true,
      isRunIdle: false,
    })
  })

  it('returns true isRunStill and Terminal when run status is failed', () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_FAILED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: false,
      isRunStill: true,
      isRunTerminal: true,
      isRunIdle: false,
    })
  })

  it('returns true isRunStill and isRunIdle when run status is idle', () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_IDLE)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: false,
      isRunStill: true,
      isRunTerminal: false,
      isRunIdle: true,
    })
  })

  it('returns true isRunRunning when status is running', () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_RUNNING)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it('returns true isRunRunning when status is paused', () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_PAUSED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })
})
