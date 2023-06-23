import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'

import { NoProtocols } from '../NoProtocols'

const render = () => {
  return renderWithProviders(<NoProtocols />, { i18nInstance: i18n })
}

const NO_PROTOCOLS_PNG_FINE_NAME = 'empty_protocol_dashboard.png'

describe('NoProtocols', () => {
  it('should render text and image', () => {
    const [{ getByText, getByRole }] = render()
    getByText('No protocols to show!')
    getByText('Send a protocol from the Opentrons app to get started.')
    const image = getByRole('img')
    expect(image.getAttribute('src')).toEqual(NO_PROTOCOLS_PNG_FINE_NAME)
  })
})
