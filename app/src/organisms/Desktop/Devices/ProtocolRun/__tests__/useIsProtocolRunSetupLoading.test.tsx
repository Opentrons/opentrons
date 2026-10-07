import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'

import { useRunRecordLabwareOffsets } from '../SetupLabwarePositionCheck/FlexSetupLPC/useRunRecordLabwareOffsets'
import { useIsProtocolRunSetupLoading } from '../useIsProtocolRunSetupLoading'

import type { FunctionComponent, ReactNode } from 'react'

vi.mock('/app/resources/analysis')
vi.mock('/app/resources/runs')
vi.mock('../SetupLabwarePositionCheck/FlexSetupLPC/useRunRecordLabwareOffsets')
vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal<typeof import('react-redux')>()
  return {
    ...actual,
    useSelector: (selector: (state: unknown) => unknown) => selector(mockState),
  }
})

const RUN_ID = 'run-id'

let mockState: {
  protocolRuns: Record<string, { lpc?: object } | undefined>
}

const wrapper: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <>{children}</>
)

describe('useIsProtocolRunSetupLoading', () => {
  beforeEach(() => {
    mockState = {
      protocolRuns: {
        [RUN_ID]: { lpc: {} },
      },
    }
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn({ id: 'analysis' } as any)
    when(vi.mocked(useStoredProtocolAnalysis))
      .calledWith(RUN_ID)
      .thenReturn(null)
    vi.mocked(useRunRecordLabwareOffsets).mockReturnValue({
      offsets: [],
      isReady: true,
    })
  })

  it('is loading while the run record is loading', () => {
    const { result } = renderHook(
      () => useIsProtocolRunSetupLoading(RUN_ID, true, false, false),
      { wrapper }
    )
    expect(result.current).toBe(true)
  })

  it('is loading while analysis is missing', () => {
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn(null)

    const { result } = renderHook(
      () => useIsProtocolRunSetupLoading(RUN_ID, false, false, false),
      { wrapper }
    )
    expect(result.current).toBe(true)
  })

  it('is loading on Flex while LPC state and previous-run offsets are missing', () => {
    mockState = { protocolRuns: { [RUN_ID]: {} } }

    const { result } = renderHook(
      () => useIsProtocolRunSetupLoading(RUN_ID, false, true, false),
      { wrapper }
    )
    expect(result.current).toBe(true)
  })

  it('is not loading on Flex once LPC state exists', () => {
    const { result } = renderHook(
      () => useIsProtocolRunSetupLoading(RUN_ID, false, true, false),
      { wrapper }
    )
    expect(result.current).toBe(false)
  })

  it('is not loading on Flex once previous-run offsets are on the run record', () => {
    mockState = { protocolRuns: { [RUN_ID]: {} } }
    vi.mocked(useRunRecordLabwareOffsets).mockReturnValue({
      offsets: [{ id: 'offset-1' } as any],
      isReady: true,
    })

    const { result } = renderHook(
      () => useIsProtocolRunSetupLoading(RUN_ID, false, true, false),
      { wrapper }
    )
    expect(result.current).toBe(false)
  })

  it('skips the LPC gate once the run has started', () => {
    mockState = { protocolRuns: { [RUN_ID]: {} } }

    const { result } = renderHook(
      () => useIsProtocolRunSetupLoading(RUN_ID, false, true, true),
      { wrapper }
    )
    expect(result.current).toBe(false)
  })

  it('is not loading when run and analysis are ready on OT-2', () => {
    mockState = { protocolRuns: { [RUN_ID]: {} } }

    const { result } = renderHook(
      () => useIsProtocolRunSetupLoading(RUN_ID, false, false, false),
      { wrapper }
    )
    expect(result.current).toBe(false)
  })
})
