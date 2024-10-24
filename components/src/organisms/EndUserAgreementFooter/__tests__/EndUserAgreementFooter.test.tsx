import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../testing/utils'
import { EndUserAgreementFooter } from '../index'

const render = () => {
  return renderWithProviders(<EndUserAgreementFooter />)
}

describe('EndUserAgreementFooter', () => {
  it('should render text and links', () => {
    render()
    screen.getByText('Copyright © 2024 Opentrons')
    expect(
      screen.getByRole('link', { name: 'privacy policy' })
    ).toHaveAttribute('href', 'https://opentrons.com/privacy-policy')
    expect(
      screen.getByRole('link', { name: 'end user license agreement' })
    ).toHaveAttribute('href', 'https://opentrons.com/eula')
  })
})
