import * as React from 'react'
import { fireEvent, waitFor } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../../i18n'
import { useIsRobotBusy } from '../../../hooks'

import { CalibrationHealthCheck } from '../CalibrationHealthCheck'

jest.mock('../../../../../redux/config')
jest.mock('../../../../../redux/robot-api/selectors')
jest.mock('../../../hooks')

const mockUseIsRobotBusy = useIsRobotBusy as jest.MockedFunction<
  typeof useIsRobotBusy
>

const mockUpdateRobotStatus = jest.fn()
const ROBOT_NAME = 'otie'

const render = (
  props: React.ComponentProps<typeof CalibrationHealthCheck>
): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<CalibrationHealthCheck {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RobotSettingsCalibration Calibration Health Check Section', () => {
  let props: React.ComponentProps<typeof CalibrationHealthCheck>
  beforeEach(() => {
    mockUseIsRobotBusy.mockReturnValue(false)
    props = {
      robotName: ROBOT_NAME,
      calCheckButtonDisabled: false,
      updateRobotStatus: mockUpdateRobotStatus,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a title and description - Calibration Health Check section', () => {
    const [{ getByText }] = render(props)
    getByText('Calibration Health Check')
    getByText(
      'Check the accuracy of key calibration points without recalibrating the robot.'
    )
  })

  it('renders a Check health button', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Check health' })
    expect(button).not.toBeDisabled()
  })

  it('Check health button is disabled when calCheckButtonDisabled is true', () => {
    props.calCheckButtonDisabled = true
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Check health' })
    expect(button).toBeDisabled()
  })

  it('Health check button shows Tooltip when pipette are not set', async () => {
    props.calCheckButtonDisabled = true
    const [{ getByRole, findByText }] = render(props)
    const button = getByRole('button', { name: 'Check health' })
    fireEvent.mouseMove(button)
    await waitFor(() => {
      findByText(
        'Fully calibrate your robot before checking calibration health'
      )
    })
  })

  it('should call update robot status if a robot is busy - health check', () => {
    mockUseIsRobotBusy.mockReturnValue(true)
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Check health' })
    fireEvent.click(button)
    expect(mockUpdateRobotStatus).toHaveBeenCalled()
  })
})
