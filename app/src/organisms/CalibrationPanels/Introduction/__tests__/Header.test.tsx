import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'
import * as Sessions from '../../../../redux/sessions'

import { i18n } from '../../../../i18n'
import { Header } from '../Header'
import { INTENT_CALIBRATE_PIPETTE_OFFSET } from '../../../DeprecatedCalibrationPanels'

const render = (props: React.ComponentProps<typeof Header>) => {
  return renderWithProviders(<Header {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('Header', () => {
  it('renders correct text for health check', () => {
    const { getByText } = render({
      sessionType: Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
    })
    getByText('Calibration Health Check')
  })
  it('renders correct text for deck cal', () => {
    const { getByText } = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
    })
    getByText('Deck Calibration')
  })
  it('renders correct text for pip offset cal extended', () => {
    const { getByText } = render({
      sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
      isExtendedPipOffset: true,
      intent: INTENT_CALIBRATE_PIPETTE_OFFSET,
    })
    getByText('Tip Length and Pipette Offset Calibration')
  })
  it('renders correct text for pip offset cal alone', () => {
    const { getByText } = render({
      sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
      isExtendedPipOffset: false,
    })
    getByText('Pipette Offset Calibration')
  })
  it('renders correct text for tip length cal', () => {
    const { getByText } = render({
      sessionType: Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
    })
    getByText('Tip Length Calibration')
  })
})
