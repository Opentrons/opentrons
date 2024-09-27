import {
  RUN_STATUS_FAILED,
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
} from '@opentrons/api-client'
import { vi, it, expect, describe, beforeEach } from 'vitest'

import { useCurrentRunId } from '../useCurrentRunId'
import { useRunStatus } from '../useRunStatus'
import { useRunStatuses } from '../useRunStatuses'

vi.mock('../useCurrentRunId')
vi.mock('../useRunStatus')

describe('useRunStatuses', () => {
  beforeEach(() => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_RUNNING)
    vi.mocked(useCurrentRunId).mockReturnValue('123')
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

  it(`returns true isRunStill and Terminal when run status is ${RUN_STATUS_SUCCEEDED}`, () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_SUCCEEDED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: false,
      isRunStill: true,
      isRunTerminal: true,
      isRunIdle: false,
    })
  })

  it(`returns true isRunStill and Terminal when run status is ${RUN_STATUS_STOPPED}`, () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_STOPPED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: false,
      isRunStill: true,
      isRunTerminal: true,
      isRunIdle: false,
    })
  })

  it(`returns true isRunStill and Terminal when run status is ${RUN_STATUS_FAILED}`, () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_FAILED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: false,
      isRunStill: true,
      isRunTerminal: true,
      isRunIdle: false,
    })
  })

  it(`returns true isRunStill and isRunIdle when run status is ${RUN_STATUS_IDLE}`, () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_IDLE)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: false,
      isRunStill: true,
      isRunTerminal: false,
      isRunIdle: true,
    })
  })

  it(`returns true isRunRunning when status is ${RUN_STATUS_RUNNING}`, () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_RUNNING)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it(`returns true isRunRunning when status is ${RUN_STATUS_PAUSED}`, () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_PAUSED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it(`returns true isRunRunning when status is ${RUN_STATUS_AWAITING_RECOVERY}`, () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_AWAITING_RECOVERY)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it(`returns true isRunRunning when status is ${RUN_STATUS_AWAITING_RECOVERY_PAUSED}`, () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_AWAITING_RECOVERY_PAUSED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it(`returns true isRunRunning when status is ${RUN_STATUS_STOP_REQUESTED}`, () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_STOP_REQUESTED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it(`returns true isRunRunning when status is ${RUN_STATUS_FINISHING}`, () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_FINISHING)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it(`returns true isRunRunning when status is ${RUN_STATUS_BLOCKED_BY_OPEN_DOOR}`, () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_BLOCKED_BY_OPEN_DOOR)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it(`returns true isRunRunning when status is ${RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR}`, () => {
    vi.mocked(useRunStatus).mockReturnValue(
      RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR
    )
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })
})
