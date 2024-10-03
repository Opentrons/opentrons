import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { NoProtocols } from '../NoProtocols'
import { screen } from '@testing-library/react'

const render = () => {
  return renderWithProviders(<NoProtocols />, { i18nInstance: i18n })
}

const NO_PROTOCOLS_PNG_FINE_NAME =
  '/app/src/assets/images/on-device-display/empty_protocol_dashboard.png'

describe('NoProtocols', () => {
  it('should render text and image', () => {
    render()
    screen.getByText('No protocols to show!')
    screen.getByText('Send a protocol from the Opentrons App to get started.')
    const image = screen.getByRole('img')
    expect(image.getAttribute('src')).toEqual(NO_PROTOCOLS_PNG_FINE_NAME)
  })
})
