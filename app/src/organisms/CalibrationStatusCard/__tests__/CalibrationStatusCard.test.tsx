import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
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
    const [{ getByText }] = render(props)

    getByText('Calibration Status')
    getByText(
      `For accurate and precise movement, calibrate the robot's deck, pipette offsets, and tip lengths.`
    )
  })

  it('renders a complete status label', () => {
    const [{ getByText }] = render(props)
    getByText('Calibration complete')
  })

  it('renders a missing status label', () => {
    mockUseCalibrationTaskList.mockReturnValue(
      expectedIncompleteDeckCalTaskList
    )
    const [{ getByText }] = render(props)
    getByText('Missing calibration data')
  })

  it('renders a recommended status label when the deck is bad', () => {
    mockUseCalibrationTaskList.mockReturnValue(expectedBadDeckTaskList)
    const [{ getByText }] = render(props)
    getByText('Calibration recommended')
  })

  it('renders a recommended status label when both the deck and offset is bad', () => {
    mockUseCalibrationTaskList.mockReturnValue(
      expectedBadDeckAndPipetteOffsetTaskList
    )
    const [{ getByText }] = render(props)
    getByText('Calibration recommended')
  })

  it('renders a recommended status label when everything is bad', () => {
    mockUseCalibrationTaskList.mockReturnValue(expectedBadEverythingTaskList)
    const [{ getByText }] = render(props)
    getByText('Calibration recommended')
  })

  it('renders a recommended status label when the offset is bad', () => {
    mockUseCalibrationTaskList.mockReturnValue(expectedBadPipetteOffsetTaskList)
    const [{ getByText }] = render(props)
    getByText('Calibration recommended')
  })

  it('renders a recommended status label when the tip length is bad', () => {
    mockUseCalibrationTaskList.mockReturnValue(expectedBadTipLengthTaskList)
    const [{ getByText }] = render(props)
    getByText('Calibration recommended')
  })

  it('renders a recommended status label when both the tip length and offset is bad', () => {
    mockUseCalibrationTaskList.mockReturnValue(
      expectedBadTipLengthAndOffsetTaskList
    )
    const [{ getByText }] = render(props)
    getByText('Calibration recommended')
  })

  it('renders a "See how robot calibration works button"', () => {
    const [{ getByRole }] = render(props)
    getByRole('button', { name: 'See how robot calibration works' }).click()
    expect(mockSetShowHowCalibrationWorksModal).toBeCalled()
  })

  it('renders a link to launch the calibration dashboard', () => {
    const [{ getByRole }] = render(props)

    const calibrationDashboardLink = getByRole('link', {
      name: 'Launch calibration',
    })
    expect(calibrationDashboardLink.getAttribute('href')).toEqual(
      '/devices/otie/robot-settings/calibration/dashboard'
    )
  })
})
