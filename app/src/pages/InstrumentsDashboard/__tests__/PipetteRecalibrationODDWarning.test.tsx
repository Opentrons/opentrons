import * as React from 'react'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'

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
