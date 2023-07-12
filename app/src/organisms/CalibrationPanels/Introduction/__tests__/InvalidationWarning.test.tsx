import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
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
    const { getByText } = render('deckCalibration')
    getByText('Recalibrating the deck clears pipette offset data')
    getByText('Pipette offsets for both mounts will have to be recalibrated.')
  })
  it('renders correct text - tip length calibration', () => {
    const { getByText } = render('tipLengthCalibration')
    getByText('Recalibrating tip length will clear pipette offset data.')
  })
})
