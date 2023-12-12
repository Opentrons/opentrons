import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { CalibrationStatusCard } from '..'
import { useCalibrationTaskList } from '../../Devices/hooks'
import {
  expectedBadDeckTaskList,
  expectedBadDeckAndPipetteOffsetTaskList,
  expectedBadEverythingTaskList,
  expectedBadPipetteOffsetTaskList,
  expectedBadTipLengthTaskList,
  expectedBadTipLengthAndOffsetTaskList,
  expectedIncompleteDeckCalTaskList,
  expectedTaskList,
} from '../../Devices/hooks/__fixtures__/taskListFixtures'

jest.mock('../../Devices/hooks')

const mockUseCalibrationTaskList = useCalibrationTaskList as jest.MockedFunction<
  typeof useCalibrationTaskList
>

const render = (props: React.ComponentProps<typeof CalibrationStatusCard>) => {
  return renderWithProviders(
    <MemoryRouter>
      <CalibrationStatusCard {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const mockSetShowHowCalibrationWorksModal = jest.fn()

describe('CalibrationStatusCard', () => {
  beforeEach(() => {
    mockUseCalibrationTaskList.mockReturnValue(expectedTaskList)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  const props: React.ComponentProps<typeof CalibrationStatusCard> = {
    robotName: 'otie',
    setShowHowCalibrationWorksModal: mockSetShowHowCalibrationWorksModal,
  }

  it('renders a calibration status title and description', () => {
    render(props)
    screen.getByText('Calibration Status')
    screen.getByText(
      `For accurate and precise movement, calibrate the robot's deck, pipette offsets, and tip lengths.`
    )
  })

  it('renders a complete status label', () => {
    render(props)
    screen.getByText('Calibration complete')
  })

  it('renders a missing status label', () => {
    mockUseCalibrationTaskList.mockReturnValue(
      expectedIncompleteDeckCalTaskList
    )
    render(props)
    screen.getByText('Missing calibration data')
  })

  it('renders a recommended status label when the deck is bad', () => {
    mockUseCalibrationTaskList.mockReturnValue(expectedBadDeckTaskList)
    render(props)
    screen.getByText('Calibration recommended')
  })

  it('renders a recommended status label when both the deck and offset is bad', () => {
    mockUseCalibrationTaskList.mockReturnValue(
      expectedBadDeckAndPipetteOffsetTaskList
    )
    render(props)
    screen.getByText('Calibration recommended')
  })

  it('renders a recommended status label when everything is bad', () => {
    mockUseCalibrationTaskList.mockReturnValue(expectedBadEverythingTaskList)
    render(props)
    screen.getByText('Calibration recommended')
  })

  it('renders a recommended status label when the offset is bad', () => {
    mockUseCalibrationTaskList.mockReturnValue(expectedBadPipetteOffsetTaskList)
    render(props)
    screen.getByText('Calibration recommended')
  })

  it('renders a recommended status label when the tip length is bad', () => {
    mockUseCalibrationTaskList.mockReturnValue(expectedBadTipLengthTaskList)
    render(props)
    screen.getByText('Calibration recommended')
  })

  it('renders a recommended status label when both the tip length and offset is bad', () => {
    mockUseCalibrationTaskList.mockReturnValue(
      expectedBadTipLengthAndOffsetTaskList
    )
    render(props)
    screen.getByText('Calibration recommended')
  })

  it('renders a "See how robot calibration works button"', () => {
    render(props)
    fireEvent.click(
      screen.getByRole('button', { name: 'See how robot calibration works' })
    )
    expect(mockSetShowHowCalibrationWorksModal).toBeCalled()
  })

  it('renders a link to launch the calibration dashboard', () => {
    render(props)
    const calibrationDashboardLink = screen.getByRole('link', {
      name: 'Launch calibration',
    })
    expect(calibrationDashboardLink.getAttribute('href')).toEqual(
      '/devices/otie/robot-settings/calibration/dashboard'
    )
  })
})
