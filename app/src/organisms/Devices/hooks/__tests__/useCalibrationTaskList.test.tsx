import * as React from 'react'
import { I18nextProvider } from 'react-i18next'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderHook } from '@testing-library/react-hooks'
import { useCalibrationTaskList } from '../useCalibrationTaskList'
import {
  useAttachedPipettes,
  useTipLengthCalibrations,
  usePipetteOffsetCalibrations,
  useDeckCalibrationData,
} from '..'
import {
  TASK_COUNT,
  mockAttachedPipettesResponse,
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

jest.mock('../')

const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>
const mockUseTipLengthCalibrations = useTipLengthCalibrations as jest.MockedFunction<
  typeof useTipLengthCalibrations
>
const mockUsePipetteOffsetCalibrations = usePipetteOffsetCalibrations as jest.MockedFunction<
  typeof usePipetteOffsetCalibrations
>
const mockUseDeckCalibrationData = useDeckCalibrationData as jest.MockedFunction<
  typeof useDeckCalibrationData
>

describe('useCalibrationTaskList hook', () => {
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    wrapper = ({ children }) => (
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
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
    when(mockUseDeckCalibrationData)
      .calledWith('otie')
      .mockReturnValue(mockCompleteDeckCalibration)
    when(mockUseTipLengthCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockCompleteTipLengthCalibrations)
    when(mockUsePipetteOffsetCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockCompletePipetteOffsetCalibrations)

    const { result } = renderHook(() => useCalibrationTaskList('otie'), {
      wrapper,
    })

    expect(result.current.taskList.length).toEqual(TASK_COUNT)
    result.current.taskList.forEach((task, i) => {
      expect(task.title).toEqual(tasks[i])
    })
  })

  it('returns a null active index when all calibrations are complete', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseDeckCalibrationData)
      .calledWith('otie')
      .mockReturnValue(mockCompleteDeckCalibration)
    when(mockUseTipLengthCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockCompleteTipLengthCalibrations)
    when(mockUsePipetteOffsetCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockCompletePipetteOffsetCalibrations)

    const { result } = renderHook(() => useCalibrationTaskList('otie'), {
      wrapper,
    })

    expect(result.current.activeIndex).toEqual(null)
  })

  it('returns "Empty" for a mount without an attached pipette', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockSingleAttachedPipetteResponse)
    when(mockUseDeckCalibrationData)
      .calledWith('otie')
      .mockReturnValue(mockCompleteDeckCalibration)
    when(mockUseTipLengthCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockCompleteTipLengthCalibrations)
    when(mockUsePipetteOffsetCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockCompletePipetteOffsetCalibrations)
    const { result } = renderHook(() => useCalibrationTaskList('otie'), {
      wrapper,
    })

    expect(result.current.taskList[2].description).toEqual('Empty')
  })

  it('returns the the correct active when Deck Calibration is needed', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseDeckCalibrationData)
      .calledWith('otie')
      .mockReturnValue(mockIncompleteDeckCalibration) // isDeckCalibrated === false
    when(mockUseTipLengthCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockCompleteTipLengthCalibrations)
    when(mockUsePipetteOffsetCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockCompletePipetteOffsetCalibrations)
    const { result } = renderHook(() => useCalibrationTaskList('otie'), {
      wrapper,
    })

    expect(result.current.activeIndex).toEqual([0, 0])
  })

  it('returns the the correct active index when a pipette is missing Offset Calibrations', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseDeckCalibrationData)
      .calledWith('otie')
      .mockReturnValue(mockCompleteDeckCalibration)
    when(mockUseTipLengthCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockCompleteTipLengthCalibrations)
    when(mockUsePipetteOffsetCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockIncompletePipetteOffsetCalibrations) // right mount marked as bad
    const { result } = renderHook(() => useCalibrationTaskList('otie'), {
      wrapper,
    })

    expect(result.current.activeIndex).toEqual([2, 1])
  })

  it('returns the the correct active index when a pipette is missing Tip Length Calibrations', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseDeckCalibrationData)
      .calledWith('otie')
      .mockReturnValue(mockCompleteDeckCalibration)
    when(mockUseTipLengthCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockIncompleteTipLengthCalibrations)
    when(mockUsePipetteOffsetCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockCompletePipetteOffsetCalibrations) // right mount marked as bad
    const { result } = renderHook(() => useCalibrationTaskList('otie'), {
      wrapper,
    })

    expect(result.current.activeIndex).toEqual([1, 0])
  })

  it('returns the earliest encountered task as the active index when multiple tasks require calibrations', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseDeckCalibrationData)
      .calledWith('otie')
      .mockReturnValue(mockIncompleteDeckCalibration) // isDeckCalibrated === false
    when(mockUseTipLengthCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockCompleteTipLengthCalibrations)
    when(mockUsePipetteOffsetCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockIncompletePipetteOffsetCalibrations) // right mount marked as bad
    const { result } = renderHook(() => useCalibrationTaskList('otie'), {
      wrapper,
    })

    expect(result.current.activeIndex).toEqual([0, 0])
  })

  it('returns descriptions for tasks that need to be completed', () => {
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(mockAttachedPipettesResponse)
    when(mockUseDeckCalibrationData)
      .calledWith('otie')
      .mockReturnValue(mockIncompleteDeckCalibration) // isDeckCalibrated === false
    when(mockUseTipLengthCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockIncompleteTipLengthCalibrations) // left calibration missing
    when(mockUsePipetteOffsetCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockIncompletePipetteOffsetCalibrations) // right mount marked as bad
    const { result } = renderHook(() => useCalibrationTaskList('otie'), {
      wrapper,
    })

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
    when(mockUseDeckCalibrationData)
      .calledWith('otie')
      .mockReturnValue(mockCompleteDeckCalibration)
    when(mockUseTipLengthCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockCompleteTipLengthCalibrations)
    when(mockUsePipetteOffsetCalibrations)
      .calledWith('otie')
      .mockReturnValue(mockCompletePipetteOffsetCalibrations)
    const { result } = renderHook(() => useCalibrationTaskList('otie'), {
      wrapper,
    })

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
})
