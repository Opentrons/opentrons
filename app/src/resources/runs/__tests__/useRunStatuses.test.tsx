import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_FAILED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'

import { useCurrentRunId } from '../useCurrentRunId'
import { useNotifyRunQuery } from '../useNotifyRunQuery'
import { useRunStatuses } from '../useRunStatuses'

vi.mock('../useCurrentRunId')
vi.mock('../useNotifyRunQuery')

const mockRunStatus = (status: any) =>
  vi.mocked(useNotifyRunQuery).mockReturnValue({
    data: { data: { status } },
  } as any)

describe('useRunStatuses', () => {
  beforeEach(() => {
    mockRunStatus(RUN_STATUS_RUNNING)
    vi.mocked(useCurrentRunId).mockReturnValue('test_id_running')
  })

  it('returns everything as false when run status is null', () => {
    vi.mocked(useNotifyRunQuery).mockReturnValue({ data: null } as any)
    const result = useRunStatuses()

    expect(result).toStrictEqual({
      isRunRunning: false,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it(`returns true isRunStill and Terminal when run status is ${RUN_STATUS_SUCCEEDED}`, () => {
    mockRunStatus(RUN_STATUS_SUCCEEDED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: false,
      isRunStill: true,
      isRunTerminal: true,
      isRunIdle: false,
    })
  })

  it(`returns true isRunStill and Terminal when run status is ${RUN_STATUS_STOPPED}`, () => {
    mockRunStatus(RUN_STATUS_STOPPED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: false,
      isRunStill: true,
      isRunTerminal: true,
      isRunIdle: false,
    })
  })

  it(`returns true isRunStill and Terminal when run status is ${RUN_STATUS_FAILED}`, () => {
    mockRunStatus(RUN_STATUS_FAILED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: false,
      isRunStill: true,
      isRunTerminal: true,
      isRunIdle: false,
    })
  })

  it(`returns true isRunStill and isRunIdle when run status is ${RUN_STATUS_IDLE}`, () => {
    mockRunStatus(RUN_STATUS_IDLE)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: false,
      isRunStill: true,
      isRunTerminal: false,
      isRunIdle: true,
    })
  })

  it(`returns true isRunRunning when status is ${RUN_STATUS_RUNNING}`, () => {
    mockRunStatus(RUN_STATUS_RUNNING)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it(`returns true isRunRunning when status is ${RUN_STATUS_PAUSED}`, () => {
    mockRunStatus(RUN_STATUS_PAUSED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it(`returns true isRunRunning when status is ${RUN_STATUS_AWAITING_RECOVERY}`, () => {
    mockRunStatus(RUN_STATUS_AWAITING_RECOVERY)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it(`returns true isRunRunning when status is ${RUN_STATUS_AWAITING_RECOVERY_PAUSED}`, () => {
    mockRunStatus(RUN_STATUS_AWAITING_RECOVERY_PAUSED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it(`returns true isRunRunning when status is ${RUN_STATUS_STOP_REQUESTED}`, () => {
    mockRunStatus(RUN_STATUS_STOP_REQUESTED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it(`returns true isRunRunning when status is ${RUN_STATUS_FINISHING}`, () => {
    mockRunStatus(RUN_STATUS_FINISHING)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it(`returns true isRunRunning when status is ${RUN_STATUS_BLOCKED_BY_OPEN_DOOR}`, () => {
    mockRunStatus(RUN_STATUS_BLOCKED_BY_OPEN_DOOR)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it(`returns true isRunRunning when status is ${RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR}`, () => {
    mockRunStatus(RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })
})
