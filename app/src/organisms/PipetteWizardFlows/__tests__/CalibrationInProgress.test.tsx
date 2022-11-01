import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CalibrationInProgress } from '../CalibrationInProgress'

const render = () => {
  return renderWithProviders(<CalibrationInProgress />, {
    i18nInstance: i18n,
  })[0]
}

describe('CalibrationInProgress', () => {
  it('returns the correct information ', () => {
    const { getByText, getByAltText } = render()
    getByText('Stand Back, Pipette is Calibrating')
    getByAltText('Pipette is calibrating')
  })
})
