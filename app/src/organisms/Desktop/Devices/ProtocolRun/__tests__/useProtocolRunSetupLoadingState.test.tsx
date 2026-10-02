import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { useIsFlex } from '/app/redux-resources/robots'
import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'

import { useProtocolRunSetupLoadingState } from '../useProtocolRunSetupLoadingState'

import type { FunctionComponent, ReactNode } from 'react'

const mockUseSelector = vi.fn()

vi.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    mockUseSelector(selector),
}))
vi.mock('/app/redux-resources/robots')
vi.mock('/app/resources/analysis')
vi.mock('/app/resources/runs')

const RUN_ID = 'run-id'
const ROBOT_NAME = 'otie'
const FLEX_LPC_STATE = { protocolRuns: { [RUN_ID]: { lpc: {} } } }

const wrapper: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <>{children}</>
)

function mockLpcState(state: unknown = {}): void {
  mockUseSelector.mockImplementation((selector: (state: unknown) => unknown) =>
    selector(state)
  )
}

describe('useProtocolRunSetupLoadingState', () => {
  beforeEach(() => {
    mockLpcState()
    when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(false)
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn({ id: 'analysis' } as any)
    when(vi.mocked(useStoredProtocolAnalysis))
      .calledWith(RUN_ID)
      .thenReturn(null)
  })

  it('is loading while the run record is loading', () => {
    const { result } = renderHook(
      () => useProtocolRunSetupLoadingState(RUN_ID, ROBOT_NAME, true),
      { wrapper }
    )
    expect(result.current.isSetupLoading).toBe(true)
  })

  it('is loading while analysis is missing', () => {
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn(null)

    const { result } = renderHook(
      () => useProtocolRunSetupLoadingState(RUN_ID, ROBOT_NAME, false),
      { wrapper }
    )
    expect(result.current.isSetupLoading).toBe(true)
  })

  it('is not loading when run and analysis are ready', () => {
    const { result } = renderHook(
      () => useProtocolRunSetupLoadingState(RUN_ID, ROBOT_NAME, false),
      { wrapper }
    )
    expect(result.current.isSetupLoading).toBe(false)
  })

  it('marks Flex setup loading while LPC store is missing', () => {
    when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(true)

    const { result } = renderHook(
      () => useProtocolRunSetupLoadingState(RUN_ID, ROBOT_NAME, false),
      { wrapper }
    )
    expect(result.current.isSetupLoading).toBe(true)
  })

  it('is not loading on Flex when LPC store exists', () => {
    when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(true)
    mockLpcState(FLEX_LPC_STATE)

    const { result } = renderHook(
      () => useProtocolRunSetupLoadingState(RUN_ID, ROBOT_NAME, false),
      { wrapper }
    )
    expect(result.current.isSetupLoading).toBe(false)
  })
})
