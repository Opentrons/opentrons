import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EndUserAgreementFooter } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'

const render = () => {
  return renderWithProviders(<EndUserAgreementFooter />, { i18nInstance: i18n })
}

const currntYear = new Date().getFullYear()

describe('EndUserAgreementFooter', () => {
  it('should render Footer component', () => {
    render()
    screen.getByText('Privacy policy')
    screen.getByText('End user license agreement')
    screen.getByText(`Copyright © ${currntYear} Opentrons`)
  })

  it('should render links', () => {
    render()
    expect(
      screen.getByRole('link', { name: 'Privacy policy' })
    ).toHaveAttribute('href', 'https://opentrons.com/privacy-policy')
    expect(
      screen.getByRole('link', { name: 'End user license agreement' })
    ).toHaveAttribute('href', 'https://opentrons.com/eula')
  })
})
