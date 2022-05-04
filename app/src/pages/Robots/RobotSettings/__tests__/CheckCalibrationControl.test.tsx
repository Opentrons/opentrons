import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { getUseTrashSurfaceForTipCal } from '../../../../redux/config'
import * as Sessions from '../../../../redux/sessions'
import { CheckCalibrationControl } from '../CheckCalibrationControl'

import { mockCalibrationCheckSessionAttributes } from '../../../../redux/sessions/__fixtures__'

jest.mock('../../../../redux/robot-api/selectors')
jest.mock('../../../../redux/sessions/selectors')
jest.mock('../../../../redux/config')
const getRobotSessionOfType = Sessions.getRobotSessionOfType as jest.MockedFunction<
  typeof Sessions.getRobotSessionOfType
>
const mockGetUseTrashSurfaceForTipCal = getUseTrashSurfaceForTipCal as jest.MockedFunction<
  typeof getUseTrashSurfaceForTipCal
>

const render = (
  props: React.ComponentProps<typeof CheckCalibrationControl>
) => {
  return renderWithProviders(<CheckCalibrationControl {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('CheckCalibrationControl', () => {
  let props: React.ComponentProps<typeof CheckCalibrationControl>

  beforeEach(() => {
    props = {
      disabledReason: null,
      robotName: 'robotName',
    }
    const mockCalibrationCheckSession: Sessions.CalibrationCheckSession = {
      id: 'fake_check_session_id',
      ...mockCalibrationCheckSessionAttributes,
    }
    getRobotSessionOfType.mockReturnValue(mockCalibrationCheckSession)
    mockGetUseTrashSurfaceForTipCal.mockReturnValue(null)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render correct text', () => {
    const { getByText, getByRole } = render(props)
    getByText('Calibration Health Check')
    getByText(
      'Check the accuracy of key calibration points without recalibrating the robot.'
    )
    const button = getByRole('button', { name: 'Check Health' })
    expect(button).not.toBeDisabled()
  })

  it('should be able to disable the button', () => {
    props = {
      disabledReason: 'disabled',
      robotName: 'robotName',
    }
    const { getByRole } = render(props)
    const button = getByRole('button', { name: 'Check Health' })
    expect(button).toBeDisabled()
  })

  it('button launches new check calibration health after confirm', () => {
    const { getByText, getByRole } = render(props)
    const button = getByRole('button', { name: 'Check Health' })
    fireEvent.click(button)
    getByText(
      'Check the accuracy of key calibration points without recalibrating the robot.'
    )
  })
})
