import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { StatusLabel } from '/app/atoms/StatusLabel'
import { i18n } from '/app/i18n'

import { CalibrationHealthCheckResults } from '../CalibrationHealthCheckResults'

import type { ComponentProps } from 'react'

vi.mock('/app/atoms/StatusLabel')

const render = (
  props: ComponentProps<typeof CalibrationHealthCheckResults>
) => {
  return renderWithProviders(<CalibrationHealthCheckResults {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('CalibrationHealthCheckResults', () => {
  let props: ComponentProps<typeof CalibrationHealthCheckResults>
  beforeEach(() => {
    props = {
      isCalibrationRecommended: false,
    }
    vi.mocked(StatusLabel).mockReturnValue(<div>mock StatusLabel</div>)
  })

  it('should render title and success StatusLabel when all calibration is good', () => {
    render(props)
    screen.getByText('Calibration Health Check Results')
    screen.getByText('mock StatusLabel')
  })

  it('should render title and warning StatusLabel when calibration results includes bad', () => {
    props.isCalibrationRecommended = true
    render(props)
    screen.getByText('mock StatusLabel')
  })
})
