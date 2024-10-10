import { vi, it, describe } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '/app/__testing-utils__'

import { i18n } from '/app/i18n'
import { PrivacySettings } from '../PrivacySettings'

vi.mock('/app/redux/analytics')
vi.mock('/app/redux/config')

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
    const [{ getByText, getByRole }] = render()
    getByText('Share App Analytics with Opentrons')
    getByText(
      'Help Opentrons improve its products and services by automatically sending anonymous diagnostics and usage data.'
    )
    getByRole('switch', { name: 'analytics_opt_in' })
  })
})
