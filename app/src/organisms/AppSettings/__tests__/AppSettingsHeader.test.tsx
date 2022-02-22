import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import * as Config from '../../../redux/config'
import { AppSettingsHeader } from '../AppSettingsHeader'

jest.mock('../../../redux/config')

const getDevtoolsEnabled = Config.getDevtoolsEnabled as jest.MockedFunction<
  typeof Config.getDevtoolsEnabled
>

const render = (props: React.ComponentProps<typeof AppSettingsHeader>) => {
  return renderWithProviders(
    <MemoryRouter>
      <AppSettingsHeader {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}
const props: React.ComponentProps<typeof AppSettingsHeader> = {
  page: 'general',
}

describe('AppSettingsHeader', () => {
  beforeEach(() => {
    getDevtoolsEnabled.mockReturnValue(false)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title', () => {
    const [{ getByText }] = render(props)
    getByText('App Settings')
  })
  it('renders correct header links', () => {
    const [{ getByRole }] = render(props)
    const generalLink = getByRole('link', {
      name: 'General',
    })
    expect(generalLink.getAttribute('href')).toBe('/app-settings/general')
    const privacyLink = getByRole('link', {
      name: 'Privacy',
    })
    expect(privacyLink.getAttribute('href')).toBe('/app-settings/privacy')
    const advancedLink = getByRole('link', {
      name: 'Advanced',
    })
    expect(advancedLink.getAttribute('href')).toBe('/app-settings/advanced')
  })
  it('does not render feature flags link if dev tools disabled', () => {
    const [{ queryByText }] = render(props)
    expect(queryByText('Feature Flags')).not.toBeInTheDocument()
  })
  it('renders feature flags link if dev tools enabled', () => {
    getDevtoolsEnabled.mockReturnValue(true)
    const [{ getByRole }] = render(props)
    const ffLink = getByRole('link', { name: 'Feature Flags' })
    expect(ffLink.getAttribute('href')).toBe('/app-settings/feature-flags')
  })
})
