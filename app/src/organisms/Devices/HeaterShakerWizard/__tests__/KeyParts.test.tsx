import { i18n } from '../../../../i18n'
import { KeyParts } from '../KeyParts'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import * as React from 'react'

const render = () => {
  return renderWithProviders(<KeyParts />, {
    i18nInstance: i18n,
  })[0]
}

describe('KeyParts', () => {
  it('renders correct title, image and body', () => {
    const { getByText, getByAltText, getByTestId } = render()

    getByText('Key Heater-Shaker parts and terminology')
    getByText(
      nestedTextMatcher(
        'Orient the module so its power ports face away from you.'
      )
    )
    getByText(
      nestedTextMatcher(
        'The Labware Latch keeps labware secure while the module is shaking.'
      )
    )
    getByText(
      'It can be opened or closed manually and with software but is closed and locked while the module is shaking.'
    )
    getByText(
      nestedTextMatcher(
        'The 2 Anchors keep the module attached to the deck while it is shaking.'
      )
    )
    getByText(
      'To extend and retract each anchor, turn the screw above it. See animation below.'
    )
    getByText(
      'Extending the anchors increases the module’s footprint, which more firmly attaches it to the slot.'
    )
    getByAltText('Heater Shaker Key Parts')

    getByTestId('heater_shaker_deck_lock')
  })
})
