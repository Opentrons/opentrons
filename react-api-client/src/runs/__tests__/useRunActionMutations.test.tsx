import { when, resetAllWhenMocks } from 'jest-when'
import { act, renderHook } from '@testing-library/react-hooks'

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
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return run action callbacks', async () => {
    const mockPlayRun = jest.fn()
    const mockPauseRun = jest.fn()
    const mockStopRun = jest.fn()

    when(mockUsePlayRunMutation)
      .calledWith(RUN_ID_1)
      .mockReturnValue(({
        playRun: mockPlayRun,
      } as unknown) as UsePlayRunMutationResult)

    when(mockUsePauseRunMutation)
      .calledWith(RUN_ID_1)
      .mockReturnValue(({
        pauseRun: mockPauseRun,
      } as unknown) as UsePauseRunMutationResult)

    when(mockUseStopRunMutation)
      .calledWith(RUN_ID_1)
      .mockReturnValue(({
        stopRun: mockStopRun,
      } as unknown) as UseStopRunMutationResult)

    const { result } = renderHook(() => useRunActionMutations(RUN_ID_1))

    act(() => result.current.playRun())
    expect(mockPlayRun).toHaveBeenCalledTimes(1)
    act(() => result.current.pauseRun())
    expect(mockPauseRun).toHaveBeenCalledTimes(1)
    act(() => result.current.stopRun())
    expect(mockStopRun).toHaveBeenCalledTimes(1)
  })
})
