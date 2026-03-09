import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { PipetteRecalibrationODDWarning } from '../PipetteRecalibrationODDWarning'

const render = () => {
  return renderWithProviders(<PipetteRecalibrationODDWarning />, {
    i18nInstance: i18n,
  })
}

describe('PipetteRecalibrationODDWarning', () => {
  it('should render text, button and icon', () => {
    render()
    screen.getByLabelText('alert-circle_icon')
    screen.getByText(
      'The attached pipettes have very different calibration values. When properly calibrated, the values should be similar.'
    )
    screen.getByRole('button')
    screen.getByLabelText('close_icon')
  })
})
