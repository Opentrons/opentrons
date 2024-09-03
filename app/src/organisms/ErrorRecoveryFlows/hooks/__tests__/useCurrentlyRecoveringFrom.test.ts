import { vi, describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'

import { useCommandQuery } from '@opentrons/react-api-client'
import {
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_IDLE,
} from '@opentrons/api-client'

import { useNotifyAllCommandsQuery } from '../../../../resources/runs'
import { useCurrentlyRecoveringFrom } from '../useCurrentlyRecoveringFrom'

vi.mock('@opentrons/react-api-client')
vi.mock('../../../../resources/runs')

const MOCK_RUN_ID = 'runId'
const MOCK_COMMAND_ID = 'commandId'

describe('useCurrentlyRecoveringFrom', () => {
  it('disables all queries if the run is not awaiting-recovery', () => {
    vi.mocked(useNotifyAllCommandsQuery).mockReturnValue({
      data: {
        links: {
          currentlyRecoveringFrom: {
            meta: {
              runId: MOCK_RUN_ID,
              commandId: MOCK_COMMAND_ID,
            },
          },
        },
      },
    } as any)
    vi.mocked(useCommandQuery).mockReturnValue({
      data: { data: 'mockCommandDetails' },
    } as any)

    const { result } = renderHook(() =>
      useCurrentlyRecoveringFrom(MOCK_RUN_ID, RUN_STATUS_IDLE)
    )

    expect(vi.mocked(useNotifyAllCommandsQuery)).toHaveBeenCalledWith(
      MOCK_RUN_ID,
      { cursor: null, pageLength: 0 },
      { enabled: false, refetchInterval: 5000 }
    )
    expect(vi.mocked(useCommandQuery)).toHaveBeenCalledWith(
      MOCK_RUN_ID,
      MOCK_COMMAND_ID,
      { enabled: false }
    )
    expect(result.current).toStrictEqual(null)
  })

  it('returns null if there is no currentlyRecoveringFrom command', () => {
    vi.mocked(useNotifyAllCommandsQuery).mockReturnValue({
      data: {
        links: {},
      },
    } as any)
    vi.mocked(useCommandQuery).mockReturnValue({} as any)

    const { result } = renderHook(() =>
      useCurrentlyRecoveringFrom(MOCK_RUN_ID, RUN_STATUS_AWAITING_RECOVERY)
    )

    expect(vi.mocked(useCommandQuery)).toHaveBeenCalledWith(null, null, {
      enabled: false,
    })
    expect(result.current).toStrictEqual(null)
  })

  it('fetches and returns the currentlyRecoveringFrom command, given that there is one', () => {
    vi.mocked(useNotifyAllCommandsQuery).mockReturnValue({
      data: {
        links: {
          currentlyRecoveringFrom: {
            meta: {
              runId: MOCK_RUN_ID,
              commandId: MOCK_COMMAND_ID,
            },
          },
        },
      },
    } as any)
    vi.mocked(useCommandQuery).mockReturnValue({
      data: { data: 'mockCommandDetails' },
    } as any)

    const { result } = renderHook(() =>
      useCurrentlyRecoveringFrom(MOCK_RUN_ID, RUN_STATUS_AWAITING_RECOVERY)
    )

    expect(vi.mocked(useCommandQuery)).toHaveBeenCalledWith(
      MOCK_RUN_ID,
      MOCK_COMMAND_ID,
      { enabled: true }
    )
    expect(result.current).toStrictEqual('mockCommandDetails')
  })
})
