import { it, describe } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { InvalidationWarning } from '../InvalidationWarning'

const render = (sessionType: 'tipLengthCalibration' | 'deckCalibration') => {
  return renderWithProviders(
    <InvalidationWarning sessionType={sessionType} />,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('InvalidationWarning', () => {
  it('renders correct text - deck calibration', () => {
    render('deckCalibration')
    screen.getByText('Recalibrating the deck clears pipette offset data')
    screen.getByText(
      'Pipette offsets for both mounts will have to be recalibrated.'
    )
  })
  it('renders correct text - tip length calibration', () => {
    render('tipLengthCalibration')
    screen.getByText('Recalibrating tip length will clear pipette offset data.')
  })
})
