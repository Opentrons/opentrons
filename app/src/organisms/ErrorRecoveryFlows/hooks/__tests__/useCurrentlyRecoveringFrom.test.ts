import { useQueryClient } from 'react-query'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_IDLE,
} from '@opentrons/api-client'
import { useCommandQuery } from '@opentrons/react-api-client'

import { useNotifyAllCommandsQuery } from '/app/resources/runs'

import { useCurrentlyRecoveringFrom } from '../useCurrentlyRecoveringFrom'

import type { Mock } from 'vitest'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/resources/runs')
vi.mock('react-query')

const MOCK_RUN_ID = 'runId'
const MOCK_COMMAND_ID = 'commandId'

describe('useCurrentlyRecoveringFrom', () => {
  let mockInvalidateQueries: Mock

  beforeEach(() => {
    mockInvalidateQueries = vi.fn()
    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as any)
  })

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
      isFetching: false,
    } as any)
    vi.mocked(useCommandQuery).mockReturnValue({
      data: { data: 'mockCommandDetails' },
      isFetching: false,
    } as any)

    const { result } = renderHook(() =>
      useCurrentlyRecoveringFrom(MOCK_RUN_ID, RUN_STATUS_IDLE)
    )

    expect(vi.mocked(useNotifyAllCommandsQuery)).toHaveBeenCalledWith(
      MOCK_RUN_ID,
      { pageLength: 0 },
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
      isFetching: false,
    } as any)
    vi.mocked(useCommandQuery).mockReturnValue({
      isFetching: false,
    } as any)

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
      isFetching: false,
    } as any)
    vi.mocked(useCommandQuery).mockReturnValue({
      data: { data: 'mockCommandDetails' },
      isFetching: false,
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

  it('returns null if all commands query is still fetching', () => {
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
      isFetching: true,
    } as any)
    vi.mocked(useCommandQuery).mockReturnValue({
      data: { data: 'mockCommandDetails' },
      isFetching: false,
    } as any)

    const { result } = renderHook(() =>
      useCurrentlyRecoveringFrom(MOCK_RUN_ID, RUN_STATUS_AWAITING_RECOVERY)
    )

    expect(result.current).toStrictEqual(null)
  })

  it('returns null if command query is still fetching', () => {
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
      isFetching: false,
    } as any)
    vi.mocked(useCommandQuery).mockReturnValue({
      data: { data: 'mockCommandDetails' },
      isFetching: true,
    } as any)

    const { result } = renderHook(() =>
      useCurrentlyRecoveringFrom(MOCK_RUN_ID, RUN_STATUS_AWAITING_RECOVERY)
    )

    expect(result.current).toStrictEqual(null)
  })

  it('resets isReadyToShow when run exits recovery mode', () => {
    const { rerender, result } = renderHook(
      ({ status }) => useCurrentlyRecoveringFrom(MOCK_RUN_ID, status),
      { initialProps: { status: RUN_STATUS_AWAITING_RECOVERY } }
    )

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
      isFetching: false,
    } as any)
    vi.mocked(useCommandQuery).mockReturnValue({
      data: { data: 'mockCommandDetails' },
      isFetching: false,
    } as any)

    rerender({ status: RUN_STATUS_AWAITING_RECOVERY })

    expect(result.current).toStrictEqual('mockCommandDetails')

    rerender({ status: RUN_STATUS_IDLE } as any)

    expect(result.current).toStrictEqual(null)
  })

  it('calls invalidateQueries when the run enters recovery mode', () => {
    renderHook(() =>
      useCurrentlyRecoveringFrom(MOCK_RUN_ID, RUN_STATUS_AWAITING_RECOVERY)
    )

    expect(mockInvalidateQueries).toHaveBeenCalled()
  })
})
