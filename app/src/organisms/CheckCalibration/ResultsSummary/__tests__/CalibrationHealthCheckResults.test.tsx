import * as React from 'react'
import {
  renderWithProviders,
  LEGACY_COLORS,
  COLORS,
  TYPOGRAPHY,
} from '@opentrons/components'
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
      isCalibrationRecommended: false,
    }
  })

  it('should render title and success StatusLabel when all calibration is good', () => {
    const { getByText, getByTestId } = render(props)
    getByText('Calibration Health Check Results')
    const statusLabel = getByText('Calibration complete')
    expect(statusLabel).toHaveStyle(`color: ${String(COLORS.black90)}`)
    expect(statusLabel).toHaveStyle(
      `font-weight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(getByTestId('status_circle')).toHaveStyle(
      `color: ${String(LEGACY_COLORS.successEnabled)}`
    )
    expect(getByTestId('status_circle')).toHaveStyle(`height: 0.3125rem`)
    expect(getByTestId('status_circle')).toHaveStyle(`width: 0.3125rem`)
  })

  it('should render title and warning StatusLabel when calibration results includes bad', () => {
    props.isCalibrationRecommended = true
    const { getByText, getByTestId } = render(props)
    getByText('Calibration recommended')
    expect(getByTestId('status_circle')).toHaveStyle(
      `color: ${String(LEGACY_COLORS.warningEnabled)}`
    )
  })
})
