import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sortRunRecordOffsets } from '/app/organisms/LabwarePositionCheck/LPCFlows/hooks/useInitLPCStore/sortRunRecordOffsets'
import { useNotifyRunQuery } from '/app/resources/runs'

import { useRunRecordLabwareOffsets } from '../useRunRecordLabwareOffsets'

import type { LabwareOffset } from '@opentrons/api-client'

vi.mock('/app/resources/runs')
vi.mock(
  '/app/organisms/LabwarePositionCheck/LPCFlows/hooks/useInitLPCStore/sortRunRecordOffsets'
)

const RUN_ID = 'run-id'

const MOCK_OFFSETS = [{ id: 'a' }, { id: 'b' }] as LabwareOffset[]

describe('useRunRecordLabwareOffsets', () => {
  beforeEach(() => {
    vi.mocked(sortRunRecordOffsets).mockImplementation(offsets => offsets)
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: { data: { labwareOffsets: MOCK_OFFSETS } },
      isFetched: true,
      isError: false,
    } as any)
  })

  it('returns sorted run-record offsets when the run is ready', () => {
    const { result } = renderHook(() => useRunRecordLabwareOffsets(RUN_ID))

    expect(useNotifyRunQuery).toHaveBeenCalledWith(RUN_ID, {
      staleTime: Infinity,
    })
    expect(sortRunRecordOffsets).toHaveBeenCalledWith(MOCK_OFFSETS)
    expect(result.current).toEqual({
      offsets: MOCK_OFFSETS,
      isReady: true,
    })
  })

  it('treats missing labwareOffsets as an empty list once the run is ready', () => {
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: { data: {} },
      isFetched: true,
      isError: false,
    } as any)

    const { result } = renderHook(() => useRunRecordLabwareOffsets(RUN_ID))

    expect(sortRunRecordOffsets).toHaveBeenCalledWith([])
    expect(result.current.isReady).toBe(true)
  })

  it('is not ready before the run query settles', () => {
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: undefined,
      isFetched: false,
      isError: false,
    } as any)

    const { result } = renderHook(() => useRunRecordLabwareOffsets(RUN_ID))

    expect(result.current).toEqual({
      offsets: [],
      isReady: false,
    })
  })
})
