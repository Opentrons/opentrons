import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { PrivacySettings } from '../PrivacySettings'

jest.mock('../../../redux/analytics')
jest.mock('../../../redux/config')

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
