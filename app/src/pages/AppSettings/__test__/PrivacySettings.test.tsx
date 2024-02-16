import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { vi, describe, it } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { PrivacySettings } from '../PrivacySettings'

vi.mock('../../../redux/analytics')
vi.mock('../../../redux/config')

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(
    <MemoryRouter>
      <PrivacySettings />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('PrivacySettings', () => {
  it('renders correct title, body text, and toggle', () => {
    render()
    screen.getByText('Share App Analytics with Opentrons')
    screen.getByText(
      'Help Opentrons improve its products and services by automatically sending anonymous diagnostics and usage data.'
    )
    screen.getByRole('switch', { name: 'analytics_opt_in' })
  })
})
