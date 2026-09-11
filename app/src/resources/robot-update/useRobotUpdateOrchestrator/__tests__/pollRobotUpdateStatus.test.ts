import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getRobotUpdateSessionStatus } from '@opentrons/api-client'

import { STATUS_POLL_MS } from '../constants'
import { pollRobotUpdateStatus } from '../pollRobotUpdateStatus'

import type {
  HostConfig,
  RobotUpdateSessionStatus,
} from '@opentrons/api-client'
import type { Dispatch } from '/app/redux/types'

vi.mock('@opentrons/api-client', () => ({
  getRobotUpdateSessionStatus: vi.fn(),
}))

const HOST_CONFIG = { hostname: '192.168.1.2' } as HostConfig
const dispatch = vi.fn() as Dispatch

function poll(
  isDone: (status: RobotUpdateSessionStatus) => boolean,
  completeOnRequestError: boolean
): Promise<RobotUpdateSessionStatus> {
  return pollRobotUpdateStatus({
    hostConfig: HOST_CONFIG,
    pathPrefix: '/server/update',
    token: 'token',
    dispatch,
    isDone,
    signal: new AbortController().signal,
    completeOnRequestError,
  })
}

function status(
  stage: RobotUpdateSessionStatus['stage']
): RobotUpdateSessionStatus {
  return { stage, progress: 0.5, message: stage }
}

describe('pollRobotUpdateStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(getRobotUpdateSessionStatus).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('rejects a request error when completeOnRequestError is false', async () => {
    vi.mocked(getRobotUpdateSessionStatus).mockRejectedValue(
      new Error('Network Error')
    )

    await expect(
      poll(s => s.stage === 'ready-for-restart', false)
    ).rejects.toThrow('Network Error')
  })

  it('treats a request error as completion after a status was seen', async () => {
    vi.mocked(getRobotUpdateSessionStatus)
      .mockResolvedValueOnce({ data: status('writing') } as any)
      .mockRejectedValue(new Error('Network Error'))

    const result = poll(s => s.stage === 'ready-for-restart', true)
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(STATUS_POLL_MS)

    await expect(result).resolves.toMatchObject({ stage: 'writing' })
  })

  it('treats a request error as completion before any status was seen', async () => {
    vi.mocked(getRobotUpdateSessionStatus).mockRejectedValue(
      new Error('Network Error')
    )

    await expect(
      poll(s => s.stage === 'ready-for-restart', true)
    ).resolves.toMatchObject({ stage: 'done', message: '' })
  })
})
