import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'
import * as Sessions from '../../../../redux/sessions'

import { i18n } from '../../../../i18n'
import { Body } from '../Body'

const render = (props: React.ComponentProps<typeof Body>) => {
  return renderWithProviders(<Body {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('Body', () => {
  it('renders correct text for health check', () => {
    const { getByText } = render({sessionType: Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK})
    getByText('Calibration Health Check diagnoses problems with Deck, Tip Length, and Pipette Offset Calibration.')
    getByText('You will move the pipettes to various positions, which will be compared against your existing calibration data.')
    getByText('If there is a large difference, you will be prompted to redo some or all of your calibrations.')
  })
  it('renders correct text for deck cal', () => {
    const { getByText } = render({sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION})
    getByText("Deck calibration ensures positional accuracy so that your robot moves as expected. It will accurately establish the OT-2’s deck orientation relative to the gantry.")
  })
  it('renders correct text for pip offset cal extended', () => {
    const { getByText } = render({sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION, isExtendedPipOffset: true})
    getByText("Calibrating pipette offset measures a pipette’s position relative to the pipette mount and the deck.")
    getByText('Tip length calibration measures the distance between the bottom of the tip and the pipette’s nozzle.')
  })
  it('renders correct text for pip offset cal alone', () => {
    const { getByText } = render({sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION, isExtendedPipOffset: false})
    getByText("Calibrating pipette offset measures a pipette’s position relative to the pipette mount and the deck.")
  })
  it('renders correct text for tip length cal', () => {
    const { getByText } = render({sessionType: Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION})
    getByText('Tip length calibration measures the distance between the bottom of the tip and the pipette’s nozzle.')
  })
})
