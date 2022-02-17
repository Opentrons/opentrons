import * as React from 'react'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { KeyParts } from '../KeyParts'

const render = () => {
  return renderWithProviders(<KeyParts />, {
    i18nInstance: i18n,
  })[0]
}

describe('KeyParts', () => {
  it('renders correct title, image and body', () => {
    const { getByText, getByAltText } = render()

    getByText('Key Heater Shaker parts and terminology')
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
      'The screw above each anchor is used to extend and retract them. See animation below.'
    )
    getByText(
      'Extending the bolts slightly increases the module’s footprint, which allows it to be more firmly attached to the edges of a slot.'
    )
    getByAltText('Heater Shaker Key Parts')
  })
})
