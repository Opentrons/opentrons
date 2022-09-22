import * as React from 'react'
import { renderWithProviders, COLORS, TYPOGRAPHY } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { CalibrationHealthCheckResults } from '../CalibrationHealthCheckResults'

const render = (
  props: React.ComponentProps<typeof CalibrationHealthCheckResults>
) => {
  return renderWithProviders(<CalibrationHealthCheckResults {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('CalibrationHealthCheckResults', () => {
  let props: React.ComponentProps<typeof CalibrationHealthCheckResults>
  beforeEach(() => {
    props = {
      isCalibrationCompleted: true,
    }
  })

  it('should render title and success StatusLabel when all calibration is good', () => {
    const { getByText, getByTestId } = render(props)
    getByText('Calibration Health Check Results')
    const statusLabel = getByText('Calibration complete')
    expect(statusLabel).toHaveStyle(`color: ${COLORS.darkBlackEnabled}`)
    expect(statusLabel).toHaveStyle(
      `font-weight: ${TYPOGRAPHY.fontWeightSemiBold}`
    )
    expect(getByTestId('status_label_Calibration complete')).toHaveStyle(
      `background-color: ${COLORS.successEnabled}1A`
    )
    expect(getByTestId('status_circle')).toHaveStyle(
      `color: ${COLORS.successEnabled}`
    )
    expect(getByTestId('status_circle')).toHaveStyle(`height: 0.3125rem`)
    expect(getByTestId('status_circle')).toHaveStyle(`width: 0.3125rem`)
  })

  it('should render title and warning StatusLabel when calibration results includes bad', () => {
    props.isCalibrationCompleted = false
    const { getByText, getByTestId } = render(props)
    getByText('Calibration recommended')
    expect(getByTestId('status_label_Calibration recommended')).toHaveStyle(
      `background-color: #F2B53C33`
    )
    expect(getByTestId('status_circle')).toHaveStyle(
      `color: ${COLORS.warningEnabled}`
    )
  })
})
