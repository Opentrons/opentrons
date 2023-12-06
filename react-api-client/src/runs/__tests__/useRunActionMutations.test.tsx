import * as React from 'react'
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

jest.mock('../usePlayRunMutation')
jest.mock('../usePauseRunMutation')
jest.mock('../useStopRunMutation')

const mockUsePlayRunMutation = usePlayRunMutation as jest.MockedFunction<
  typeof usePlayRunMutation
>
const mockUsePauseRunMutation = usePauseRunMutation as jest.MockedFunction<
  typeof usePauseRunMutation
>
const mockUseStopRunMutation = useStopRunMutation as jest.MockedFunction<
  typeof useStopRunMutation
>

describe('useRunActionMutations hook', () => {
  let wrapper: React.FunctionComponent<{children: React.ReactNode}>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return run action callbacks', async () => {
    const mockPlayRun = jest.fn()
    const mockPauseRun = jest.fn()
    const mockStopRun = jest.fn()

    mockUsePlayRunMutation.mockReturnValue(({
      playRun: mockPlayRun,
    } as unknown) as UsePlayRunMutationResult)

    mockUsePauseRunMutation.mockReturnValue(({
      pauseRun: mockPauseRun,
    } as unknown) as UsePauseRunMutationResult)

    mockUseStopRunMutation.mockReturnValue(({
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
