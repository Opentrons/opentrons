import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { useIsFlex } from '/app/redux-resources/robots'
import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { useNotifyCamera } from '/app/resources/camera/useNotifyCamera'
import { useNotifyClientDataLPC } from '/app/resources/client_data'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'

import { useProtocolRunSetupLoadingState } from '../useProtocolRunSetupLoadingState'

import type { FunctionComponent, ReactNode } from 'react'

vi.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}))
vi.mock('/app/redux-resources/robots')
vi.mock('/app/resources/analysis')
vi.mock('/app/resources/camera/useNotifyCamera')
vi.mock('/app/resources/client_data')
vi.mock('/app/resources/runs')

const RUN_ID = 'run-id'
const ROBOT_NAME = 'otie'

const wrapper: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <>{children}</>
)

describe('useProtocolRunSetupLoadingState', () => {
  beforeEach(() => {
    when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(false)
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn({ id: 'analysis' } as any)
    when(vi.mocked(useStoredProtocolAnalysis))
      .calledWith(RUN_ID)
      .thenReturn(null)
    vi.mocked(useNotifyCamera).mockReturnValue({
      data: { cameraEnabled: false },
      isLoading: false,
    } as any)
    vi.mocked(useNotifyClientDataLPC).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any)
  })

  it('is loading while the run record is loading', () => {
    const { result } = renderHook(
      () => useProtocolRunSetupLoadingState(RUN_ID, ROBOT_NAME, false, true),
      { wrapper }
    )

    expect(result.current.isRunOrAnalysisLoading).toBe(true)
    expect(result.current.isSetupLoading).toBe(true)
    expect(result.current.isRunRecordLoading).toBe(true)
  })

  it('is loading while analysis is missing', () => {
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn(null)
    when(vi.mocked(useStoredProtocolAnalysis))
      .calledWith(RUN_ID)
      .thenReturn(null)

    const { result } = renderHook(
      () => useProtocolRunSetupLoadingState(RUN_ID, ROBOT_NAME, false, false),
      { wrapper }
    )

    expect(result.current.isRunOrAnalysisLoading).toBe(true)
    expect(result.current.isSetupLoading).toBe(true)
  })

  it('marks Flex setup loading while LPC is initializing', () => {
    when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(true)

    const { result } = renderHook(
      () => useProtocolRunSetupLoadingState(RUN_ID, ROBOT_NAME, true, false),
      { wrapper }
    )

    expect(result.current.isFlexLPCSettled).toBe(false)
    expect(result.current.isRunOrAnalysisLoading).toBe(false)
    expect(result.current.isSetupLoading).toBe(true)
  })

  it('settles Flex LPC once init and client data are done, even if offsets are not applied', () => {
    when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(true)

    const { result } = renderHook(
      () => useProtocolRunSetupLoadingState(RUN_ID, ROBOT_NAME, false, false),
      { wrapper }
    )

    expect(result.current.isFlexLPCSettled).toBe(true)
    expect(result.current.isRunOrAnalysisLoading).toBe(false)
    expect(result.current.isSetupLoading).toBe(false)
  })

  it('marks Flex setup loading while client LPC data is loading', () => {
    when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(true)
    vi.mocked(useNotifyClientDataLPC).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    const { result } = renderHook(
      () => useProtocolRunSetupLoadingState(RUN_ID, ROBOT_NAME, false, false),
      { wrapper }
    )

    expect(result.current.isFlexLPCSettled).toBe(false)
    expect(result.current.isSetupLoading).toBe(true)
  })

  it('marks Flex setup loading while camera settings load', () => {
    when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(true)
    vi.mocked(useNotifyCamera).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    const { result } = renderHook(
      () => useProtocolRunSetupLoadingState(RUN_ID, ROBOT_NAME, false, false),
      { wrapper }
    )

    expect(result.current.isSetupLoading).toBe(true)
    expect(result.current.isCameraLoading).toBe(true)
  })
})
