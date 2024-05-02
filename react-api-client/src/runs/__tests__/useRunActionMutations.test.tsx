import * as React from 'react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook } from '@testing-library/react'

import { RUN_ID_1 } from '../__fixtures__'
import {
  useRunActionMutations,
  UsePlayRunMutationResult,
  UsePauseRunMutationResult,
  UseStopRunMutationResult,
  usePlayRunMutation,
  usePauseRunMutation,
  useStopRunMutation,
} from '..'

vi.mock('../usePlayRunMutation')
vi.mock('../usePauseRunMutation')
vi.mock('../useStopRunMutation')

describe('useRunActionMutations hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return run action callbacks', async () => {
    const mockPlayRun = vi.fn()
    const mockPauseRun = vi.fn()
    const mockStopRun = vi.fn()

    vi.mocked(usePlayRunMutation).mockReturnValue(({
      playRun: mockPlayRun,
    } as unknown) as UsePlayRunMutationResult)

    vi.mocked(usePauseRunMutation).mockReturnValue(({
      pauseRun: mockPauseRun,
    } as unknown) as UsePauseRunMutationResult)

    vi.mocked(useStopRunMutation).mockReturnValue(({
      stopRun: mockStopRun,
    } as unknown) as UseStopRunMutationResult)

    const { result } = renderHook(() => useRunActionMutations(RUN_ID_1), {
      wrapper,
    })

    act(() => result.current.playRun())
    expect(mockPlayRun).toHaveBeenCalledTimes(1)
    expect(mockPlayRun).toHaveBeenCalledWith(RUN_ID_1)
    act(() => result.current.pauseRun())
    expect(mockPauseRun).toHaveBeenCalledTimes(1)
    expect(mockPauseRun).toHaveBeenCalledWith(RUN_ID_1)
    act(() => result.current.stopRun())
    expect(mockStopRun).toHaveBeenCalledTimes(1)
    expect(mockStopRun).toHaveBeenCalledWith(RUN_ID_1)
  })
})
