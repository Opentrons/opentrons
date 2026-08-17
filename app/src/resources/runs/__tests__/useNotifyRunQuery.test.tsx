import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRunQuery } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '/app/resources/useNotifyDataReady'

import { useNotifyRunQuery } from '../useNotifyRunQuery'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/resources/useNotifyDataReady')

const MOCK_RUN_ID = 'run-123'
const MOCK_OPTIONS = { staleTime: 5000 }

describe('useNotifyRunQuery', () => {
  const refetch = vi.fn()
  const queryOptionsNotify = { ...MOCK_OPTIONS, refetchInterval: false }

  beforeEach(() => {
    vi.mocked(useNotifyDataReady).mockReturnValue({
      shouldRefetch: false,
      queryOptionsNotify,
    } as any)
    vi.mocked(useRunQuery).mockReturnValue({
      refetch,
    } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should pass notify options through to useRunQuery', () => {
    renderHook(() => useNotifyRunQuery(MOCK_RUN_ID, MOCK_OPTIONS))

    expect(useNotifyDataReady).toHaveBeenCalledWith({
      topic: `robot-server/runs/${MOCK_RUN_ID}`,
      options: MOCK_OPTIONS,
      hostOverride: undefined,
    })
    expect(useRunQuery).toHaveBeenCalledWith(
      MOCK_RUN_ID,
      queryOptionsNotify,
      undefined
    )
  })

  it('should refetch in an effect when shouldRefetch is true, not during render', () => {
    vi.mocked(useNotifyDataReady).mockReturnValue({
      shouldRefetch: true,
      queryOptionsNotify,
    } as any)
    vi.mocked(useRunQuery).mockImplementation(() => {
      // useRunQuery runs during render; refetch must not have been called yet.
      expect(refetch).not.toHaveBeenCalled()
      return { refetch } as any
    })

    renderHook(() => useNotifyRunQuery(MOCK_RUN_ID, MOCK_OPTIONS))

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('should not refetch when shouldRefetch is false', () => {
    renderHook(() => useNotifyRunQuery(MOCK_RUN_ID, MOCK_OPTIONS))

    expect(refetch).not.toHaveBeenCalled()
  })

  it('should not refetch when runId is null', () => {
    vi.mocked(useNotifyDataReady).mockReturnValue({
      shouldRefetch: true,
      queryOptionsNotify,
    } as any)

    renderHook(() => useNotifyRunQuery(null, MOCK_OPTIONS))

    expect(refetch).not.toHaveBeenCalled()
  })

  it('should not refetch when runId is the string "null"', () => {
    vi.mocked(useNotifyDataReady).mockReturnValue({
      shouldRefetch: true,
      queryOptionsNotify,
    } as any)

    renderHook(() => useNotifyRunQuery('null', MOCK_OPTIONS))

    expect(refetch).not.toHaveBeenCalled()
  })

  it('should refetch when shouldRefetch becomes true after a rerender', () => {
    const { rerender } = renderHook(() =>
      useNotifyRunQuery(MOCK_RUN_ID, MOCK_OPTIONS)
    )

    expect(refetch).not.toHaveBeenCalled()

    vi.mocked(useNotifyDataReady).mockReturnValue({
      shouldRefetch: true,
      queryOptionsNotify,
    } as any)
    rerender()

    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
