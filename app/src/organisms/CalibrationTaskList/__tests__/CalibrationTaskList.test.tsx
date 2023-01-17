import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CalibrationTaskList } from '..'
import { useCalibrationTaskList } from '../../Devices/hooks'
import {
  expectedTaskList,
  mockDeckCalLauncher,
  mockTipLengthCalLauncher,
  mockPipOffsetCalLauncher,
  expectedIncompleteDeckCalTaskList,
  expectedIncompleteLeftMountTaskList,
  expectedIncompleteRightMountTaskList,
} from '../../Devices/hooks/__fixtures__/taskListFixtures'
import { StaticRouter } from 'react-router-dom'
import { TaskListProps } from '../../TaskList/types'

jest.mock('../../Devices/hooks')

const mockUseCalibrationTaskList = useCalibrationTaskList as jest.MockedFunction<
  typeof useCalibrationTaskList
>

const render = () => {
  return renderWithProviders(
    <StaticRouter>
      <CalibrationTaskList
        robotName="otie"
        pipOffsetCalLauncher={jest.fn()}
        tipLengthCalLauncher={jest.fn()}
        deckCalLauncher={jest.fn()}
      />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('CalibrationTaskList', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the Calibration Task List', () => {
    mockUseCalibrationTaskList.mockReturnValue(expectedTaskList)
    const [{ getByText }] = render()
    getByText('Deck Calibration')
    getByText('Left Mount')
    getByText('Right Mount')
  })

  it('clicking the recalibrate CTAs triggers the calibration launchers', () => {
    mockUseCalibrationTaskList.mockReturnValue(expectedTaskList)
    const [{ getByText, getAllByText }] = render()
    getByText('Left Mount').click()
    getByText('Right Mount').click()
    const recalibrateButtons = getAllByText('Recalibrate') // [deck, left-tip-length, left-offset, right-tip-length, left-offset]
    expect(recalibrateButtons).toHaveLength(5)

    recalibrateButtons[0].click()
    expect(mockDeckCalLauncher).toHaveBeenCalled()
    recalibrateButtons[1].click()
    expect(mockTipLengthCalLauncher).toHaveBeenCalled()
    recalibrateButtons[2].click()
    expect(mockPipOffsetCalLauncher).toHaveBeenCalled()
    recalibrateButtons[3].click()
    expect(mockTipLengthCalLauncher).toHaveBeenCalled()
    recalibrateButtons[4].click()
    expect(mockPipOffsetCalLauncher).toHaveBeenCalled()
  })

  it('clicking the deck calibrate CTA triggers the calibration launcher', () => {
    mockUseCalibrationTaskList.mockReturnValue(
      expectedIncompleteDeckCalTaskList
    )
    const [{ getByText }] = render()
    getByText('Calibrate').click()
    expect(mockDeckCalLauncher).toHaveBeenCalled()
  })

  it('clicking the Left Mount calibrate CTAs triggers the calibration launchers', () => {
    mockUseCalibrationTaskList.mockReturnValue(
      expectedIncompleteLeftMountTaskList
    )
    const [{ getByText, getAllByText, unmount }] = render()
    getByText('Left Mount').click()
    getByText('Calibrate').click()
    expect(mockTipLengthCalLauncher).toHaveBeenCalled()
    unmount()
    const updatedTaskList = {
      ...expectedIncompleteLeftMountTaskList,
      activeIndex: [1, 1],
    } as TaskListProps
    mockUseCalibrationTaskList.mockReturnValue(updatedTaskList)
    render()
    getByText('Left Mount').click()
    // the previous Calibrate CTA still shows because we just manually changed the activeIndex to make the next button available, so grab the 2nd one
    getAllByText('Calibrate')[1].click()
    expect(mockPipOffsetCalLauncher).toHaveBeenCalled()
  })

  it('clicking the Right Mount calibrate CTAs triggers the calibration launchers', () => {
    mockUseCalibrationTaskList.mockReturnValue(
      expectedIncompleteRightMountTaskList
    )
    const [{ getByText, getAllByText, unmount }] = render()
    getByText('Right Mount').click()
    getByText('Calibrate').click()
    expect(mockTipLengthCalLauncher).toHaveBeenCalled()
    unmount()
    const updatedTaskList = {
      ...expectedIncompleteRightMountTaskList,
      activeIndex: [2, 1],
    } as TaskListProps
    mockUseCalibrationTaskList.mockReturnValue(updatedTaskList)
    render()
    getByText('Right Mount').click()
    // the previous Calibrate CTA still shows because we just manually changed the activeIndex to make the next button available, so grab the 2nd one
    getAllByText('Calibrate')[1].click()
    expect(mockPipOffsetCalLauncher).toHaveBeenCalled()
  })
})
