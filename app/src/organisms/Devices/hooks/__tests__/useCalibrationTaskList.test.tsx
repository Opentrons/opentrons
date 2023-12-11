import * as React from 'react'
import { createStore } from 'redux'
import { I18nextProvider } from 'react-i18next'
import { Provider } from 'react-redux'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderHook } from '@testing-library/react'
import {
  useDeleteCalibrationMutation,
  useAllPipetteOffsetCalibrationsQuery,
  useAllTipLengthCalibrationsQuery,
  useCalibrationStatusQuery,
} from '@opentrons/react-api-client'
import { useCalibrationTaskList } from '../useCalibrationTaskList'
import { useAttachedPipettes } from '..'
import {
  TASK_COUNT,
  mockAttachedPipettesResponse,
  mockBadDeckCalibration,
  mockBadPipetteOffsetCalibrations,
  mockBadTipLengthCalibrations,
  mockCompleteDeckCalibration,
  mockCompletePipetteOffsetCalibrations,
  mockCompleteTipLengthCalibrations,
  mockIncompleteDeckCalibration,
  mockSingleAttachedPipetteResponse,
  mockIncompletePipetteOffsetCalibrations,
  mockIncompleteTipLengthCalibrations,
  expectedTaskList,
} from '../__fixtures__/taskListFixtures'
import { i18n } from '../../../../i18n'

import type { Store } from 'redux'
import type { State } from '../../../../redux/types'

jest.mock('../')
jest.mock('@opentrons/react-api-client')

const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>
const mockUseAllTipLengthCalibrationsQuery = useAllTipLengthCalibrationsQuery as jest.MockedFunction<
  typeof useAllTipLengthCalibrationsQuery
>
const mockUseAllPipetteOffsetCalibrationsQuery = useAllPipetteOffsetCalibrationsQuery as jest.MockedFunction<
  typeof useAllPipetteOffsetCalibrationsQuery
>
const mockUseCalibrationStatusQuery = useCalibrationStatusQuery as jest.MockedFunction<
  typeof useCalibrationStatusQuery
>
const mockUseDeleteCalibrationMutation = useDeleteCalibrationMutation as jest.MockedFunction<
  typeof useDeleteCalibrationMutation
>

const mockPipOffsetCalLauncher = jest.fn()
const mockTipLengthCalLauncher = jest.fn()
const mockDeckCalLauncher = jest.fn()

describe('useCalibrationTaskList hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  let store: Store<State>
  const mockDeleteCalibration = jest.fn()

  beforeEach(() => {
    mockUseDeleteCalibrationMutation.mockReturnValue({
      deleteCalibration: mockDeleteCalibration,
    } as any)
    store = createStore(jest.fn(), {})
    store.dispatch = jest.fn()
    wrapper = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{children}</Provider>
      </I18nextProvider>
    )
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns a task list with 3 tasks: Deck Calibration, Left Mount, and Right Mount', () => {
    const tasks = ['Deck Calibration', 'Left Mount', 'Right Mount']
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: mockCompleteDeckCalibration } as any)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompleteTipLengthCalibrations },
      } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompletePipetteOffsetCalibrations },
      } as any)

    const { result } = renderHook(
      () =>
        useCalibrationTaskList(
          mockPipOffsetCalLauncher,
          mockTipLengthCalLauncher,
          mockDeckCalLauncher
        ),
      {
        wrapper,
      }
    )

    expect(result.current.taskList.length).toEqual(TASK_COUNT)
    result.current.taskList.forEach((task, i) => {
      expect(task.title).toEqual(tasks[i])
    })
  })

  it('returns a null active index when all calibrations are complete', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: mockCompleteDeckCalibration } as any)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompleteTipLengthCalibrations },
      } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompletePipetteOffsetCalibrations },
      } as any)

    const { result } = renderHook(
      () =>
        useCalibrationTaskList(mockTipLengthCalLauncher, mockDeckCalLauncher),
      {
        wrapper,
      }
    )

    expect(result.current.activeIndex).toEqual(null)
  })

  it('returns "Empty" for a mount without an attached pipette', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockSingleAttachedPipetteResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: mockCompleteDeckCalibration } as any)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompleteTipLengthCalibrations },
      } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompletePipetteOffsetCalibrations },
      } as any)
    const { result } = renderHook(
      () =>
        useCalibrationTaskList(
          mockPipOffsetCalLauncher,
          mockTipLengthCalLauncher,
          mockDeckCalLauncher
        ),
      {
        wrapper,
      }
    )

    expect(result.current.taskList[2].description).toEqual('Empty')
  })

  it('returns the the correct active when Deck Calibration is needed', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: mockIncompleteDeckCalibration } as any)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompleteTipLengthCalibrations },
      } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompletePipetteOffsetCalibrations },
      } as any)
    const { result } = renderHook(
      () =>
        useCalibrationTaskList(
          mockPipOffsetCalLauncher,
          mockTipLengthCalLauncher,
          mockDeckCalLauncher
        ),
      {
        wrapper,
      }
    )

    expect(result.current.activeIndex).toEqual([0, 0])
  })

  it('returns the the correct active when Deck Recalibration is needed', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: mockBadDeckCalibration } as any) // markedBad === true
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompleteTipLengthCalibrations },
      } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompletePipetteOffsetCalibrations },
      } as any)
    const { result } = renderHook(
      () =>
        useCalibrationTaskList(
          mockPipOffsetCalLauncher,
          mockTipLengthCalLauncher,
          mockDeckCalLauncher
        ),
      {
        wrapper,
      }
    )

    expect(result.current.activeIndex).toEqual([0, 0])
  })

  it('returns the the correct active index when a pipette is missing Offset Calibrations', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: mockCompleteDeckCalibration } as any)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompleteTipLengthCalibrations },
      } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockIncompletePipetteOffsetCalibrations },
      } as any) // right mount marked as bad
    const { result } = renderHook(
      () =>
        useCalibrationTaskList(
          mockPipOffsetCalLauncher,
          mockTipLengthCalLauncher,
          mockDeckCalLauncher
        ),
      {
        wrapper,
      }
    )

    expect(result.current.activeIndex).toEqual([2, 1])
  })

  it('returns the the correct active index when both pipettes have bad Offset Calibrations', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: mockCompleteDeckCalibration } as any)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompleteTipLengthCalibrations },
      } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockBadPipetteOffsetCalibrations },
      } as any)
    const { result } = renderHook(
      () =>
        useCalibrationTaskList(
          mockPipOffsetCalLauncher,
          mockTipLengthCalLauncher,
          mockDeckCalLauncher
        ),
      {
        wrapper,
      }
    )

    expect(result.current.activeIndex).toEqual([1, 1])
  })

  it('returns the the correct active index when a pipette is missing Tip Length Calibrations', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: mockCompleteDeckCalibration } as any)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockIncompleteTipLengthCalibrations },
      } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompletePipetteOffsetCalibrations },
      } as any)
    const { result } = renderHook(
      () =>
        useCalibrationTaskList(
          mockPipOffsetCalLauncher,
          mockTipLengthCalLauncher,
          mockDeckCalLauncher
        ),
      {
        wrapper,
      }
    )

    expect(result.current.activeIndex).toEqual([1, 0])
  })

  it('returns the the correct active index when both pipettes have bad Tip Length Calibrations', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: mockCompleteDeckCalibration } as any)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: { data: mockBadTipLengthCalibrations } } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompletePipetteOffsetCalibrations },
      } as any)
    const { result } = renderHook(
      () =>
        useCalibrationTaskList(
          mockPipOffsetCalLauncher,
          mockTipLengthCalLauncher,
          mockDeckCalLauncher
        ),
      {
        wrapper,
      }
    )

    expect(result.current.activeIndex).toEqual([1, 0])
  })

  it('returns the the correct active index when both tlc and poc are bad', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: mockCompleteDeckCalibration } as any)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: { data: mockBadTipLengthCalibrations } } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockBadPipetteOffsetCalibrations },
      } as any)
    const { result } = renderHook(
      () =>
        useCalibrationTaskList(
          mockPipOffsetCalLauncher,
          mockTipLengthCalLauncher,
          mockDeckCalLauncher
        ),
      {
        wrapper,
      }
    )

    expect(result.current.activeIndex).toEqual([1, 0])
  })

  it('returns the the correct active index when both deck and poc are bad', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: mockBadDeckCalibration } as any)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompleteTipLengthCalibrations },
      } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockBadPipetteOffsetCalibrations },
      } as any)
    const { result } = renderHook(
      () =>
        useCalibrationTaskList(
          mockPipOffsetCalLauncher,
          mockTipLengthCalLauncher,
          mockDeckCalLauncher
        ),
      {
        wrapper,
      }
    )

    expect(result.current.activeIndex).toEqual([0, 0])
  })

  it('returns the the correct active index when all calibrations are marked bad', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: mockBadDeckCalibration } as any)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: { data: mockBadTipLengthCalibrations } } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockBadPipetteOffsetCalibrations },
      } as any)
    const { result } = renderHook(
      () =>
        useCalibrationTaskList(
          mockPipOffsetCalLauncher,
          mockTipLengthCalLauncher,
          mockDeckCalLauncher
        ),
      {
        wrapper,
      }
    )

    expect(result.current.activeIndex).toEqual([0, 0])
  })

  it('returns the earliest encountered task as the active index when multiple tasks require calibrations', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: mockIncompleteDeckCalibration } as any)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompleteTipLengthCalibrations },
      } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockIncompletePipetteOffsetCalibrations },
      } as any) // right mount marked as bad
    const { result } = renderHook(
      () =>
        useCalibrationTaskList(
          mockPipOffsetCalLauncher,
          mockTipLengthCalLauncher,
          mockDeckCalLauncher
        ),
      {
        wrapper,
      }
    )

    expect(result.current.activeIndex).toEqual([0, 0])
  })

  it('returns descriptions for tasks that need to be completed', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: null } as any) // null deck response
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockIncompleteTipLengthCalibrations },
      } as any) // left calibration missing
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockIncompletePipetteOffsetCalibrations },
      } as any) // right mount marked as bad
    const { result } = renderHook(
      () =>
        useCalibrationTaskList(
          mockPipOffsetCalLauncher,
          mockTipLengthCalLauncher,
          mockDeckCalLauncher
        ),
      {
        wrapper,
      }
    )

    expect(result.current.taskList[0].description).toEqual(
      'Start with Deck Calibration, which is the basis for the rest of calibration.'
    )
    expect(result.current.taskList[1].subTasks[0].description).toEqual(
      'Calibrate the length of a tip on this pipette.'
    )
    expect(result.current.taskList[2].subTasks[1].description).toEqual(
      "Calibrate this pipette's offset while attached to the robot's right mount."
    )
  })

  it('returns timestamps for tasks that have been completed', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: mockCompleteDeckCalibration } as any)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompleteTipLengthCalibrations },
      } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompletePipetteOffsetCalibrations },
      } as any)
    const { result } = renderHook(
      () =>
        useCalibrationTaskList(
          mockPipOffsetCalLauncher,
          mockTipLengthCalLauncher,
          mockDeckCalLauncher
        ),
      {
        wrapper,
      }
    )

    expect(result.current.taskList[0].footer).toEqual(
      expectedTaskList.taskList[0].footer
    )
    expect(result.current.taskList[1].subTasks[0].footer).toEqual(
      expectedTaskList.taskList[1].subTasks[0].footer
    )
    expect(result.current.taskList[2].subTasks[1].footer).toEqual(
      expectedTaskList.taskList[2].subTasks[1].footer
    )
  })

  it('passes the launcher function to cta onclick handlers for recalibration', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: mockCompleteDeckCalibration } as any)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompleteTipLengthCalibrations },
      } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockCompletePipetteOffsetCalibrations },
      } as any)

    const { result } = renderHook(
      () =>
        useCalibrationTaskList(
          mockPipOffsetCalLauncher,
          mockTipLengthCalLauncher,
          mockDeckCalLauncher
        ),
      {
        wrapper,
      }
    )

    result.current.taskList[0].cta?.onClick()
    expect(mockDeckCalLauncher).toHaveBeenCalledTimes(1)
    result.current.taskList[1].subTasks[0].cta?.onClick()
    expect(mockTipLengthCalLauncher).toHaveBeenCalledTimes(1)
    result.current.taskList[1].subTasks[1].cta?.onClick()
    expect(mockPipOffsetCalLauncher).toHaveBeenCalledTimes(1)
    result.current.taskList[2].subTasks[0].cta?.onClick()
    expect(mockTipLengthCalLauncher).toHaveBeenCalledTimes(2)
    result.current.taskList[2].subTasks[1].cta?.onClick()
    expect(mockPipOffsetCalLauncher).toHaveBeenCalledTimes(2)
  })

  it('passes the launcher function to cta onclick handlers for calibration', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseCalibrationStatusQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({ data: mockIncompleteDeckCalibration } as any)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockIncompleteTipLengthCalibrations },
      } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: 5000 })
      .mockReturnValue({
        data: { data: mockIncompletePipetteOffsetCalibrations },
      } as any)

    const { result } = renderHook(
      () =>
        useCalibrationTaskList(
          mockPipOffsetCalLauncher,
          mockTipLengthCalLauncher,
          mockDeckCalLauncher
        ),
      {
        wrapper,
      }
    )

    result.current.taskList[0].cta?.onClick()
    expect(mockDeckCalLauncher).toHaveBeenCalledTimes(1)
    result.current.taskList[1].subTasks[0].cta?.onClick()
    expect(mockTipLengthCalLauncher).toHaveBeenCalledTimes(1)
    result.current.taskList[1].subTasks[1].cta?.onClick()
    expect(mockPipOffsetCalLauncher).toHaveBeenCalledTimes(1)
    result.current.taskList[2].subTasks[0].cta?.onClick()
    expect(mockTipLengthCalLauncher).toHaveBeenCalledTimes(2)
    result.current.taskList[2].subTasks[1].cta?.onClick()
    expect(mockPipOffsetCalLauncher).toHaveBeenCalledTimes(2)
  })
})
