import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useCurrentRunRoute } from '../useCurrentRunRoute'
import { useNotifyRunQuery } from '/app/resources/runs'
import {
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_FAILED,
  RUN_STATUS_IDLE,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'

vi.mock('/app/resources/runs')

const MOCK_RUN_ID = 'MOCK_RUN_ID'

describe('useCurrentRunRoute', () => {
  it('returns null when the run record is null', () => {
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: null,
      isFetching: false,
    } as any)

    const { result } = renderHook(() => useCurrentRunRoute(MOCK_RUN_ID))

    expect(result.current).toBeNull()
  })

  it('returns null when isFetching is true', () => {
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: { data: { startedAt: '123' } },
      isFetching: true,
    } as any)

    const { result } = renderHook(() => useCurrentRunRoute(MOCK_RUN_ID))

    expect(result.current).toBeNull()
  })

  it('returns the summary route for a run with succeeded status', () => {
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: {
        data: {
          id: MOCK_RUN_ID,
          status: RUN_STATUS_SUCCEEDED,
          startedAt: '123',
        },
      },
      isFetching: false,
    } as any)

    const { result } = renderHook(() => useCurrentRunRoute(MOCK_RUN_ID))

    expect(result.current).toBe(`/runs/${MOCK_RUN_ID}/summary`)
  })

  it('returns the summary route for a started run that has a stopped status', () => {
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: {
        data: {
          id: MOCK_RUN_ID,
          status: RUN_STATUS_STOPPED,
          startedAt: '123',
        },
      },
      isFetching: false,
    } as any)

    const { result } = renderHook(() => useCurrentRunRoute(MOCK_RUN_ID))

    expect(result.current).toBe(`/runs/${MOCK_RUN_ID}/summary`)
  })

  it('returns summary route for a run with failed status', () => {
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: {
        data: { id: MOCK_RUN_ID, status: RUN_STATUS_FAILED, startedAt: '123' },
      },
      isFetching: false,
    } as any)

    const { result } = renderHook(() => useCurrentRunRoute(MOCK_RUN_ID))

    expect(result.current).toBe(`/runs/${MOCK_RUN_ID}/summary`)
  })

  it('returns the setup route for a run with an idle status', () => {
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: {
        data: { id: MOCK_RUN_ID, status: RUN_STATUS_IDLE, startedAt: null },
      },
      isFetching: false,
    } as any)

    const { result } = renderHook(() => useCurrentRunRoute(MOCK_RUN_ID))

    expect(result.current).toBe(`/runs/${MOCK_RUN_ID}/setup`)
  })

  it('returns the setup route for a "blocked by open door" run that has not been started yet', () => {
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: {
        data: {
          id: MOCK_RUN_ID,
          status: RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
          startedAt: null,
        },
      },
      isFetching: false,
    } as any)

    const { result } = renderHook(() => useCurrentRunRoute(MOCK_RUN_ID))

    expect(result.current).toBe(`/runs/${MOCK_RUN_ID}/setup`)
  })

  it('returns run route for a started run', () => {
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: {
        data: {
          id: MOCK_RUN_ID,
          status: RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
          startedAt: '123',
        },
      },
      isFetching: false,
    } as any)

    const { result } = renderHook(() => useCurrentRunRoute(MOCK_RUN_ID))

    expect(result.current).toBe(`/runs/${MOCK_RUN_ID}/run`)
  })

  it('returns null for cancelled run before starting', () => {
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: {
        data: { id: MOCK_RUN_ID, status: RUN_STATUS_STOPPED, startedAt: null },
      },
      isFetching: false,
    } as any)

    const { result } = renderHook(() => useCurrentRunRoute(MOCK_RUN_ID))

    expect(result.current).toBeNull()
  })
})
