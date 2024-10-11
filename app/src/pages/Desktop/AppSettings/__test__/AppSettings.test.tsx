import { vi, describe, beforeEach, it, expect, afterEach } from 'vitest'
import { Route } from 'react-router'
import { MemoryRouter, Routes } from 'react-router-dom'

import { renderWithProviders } from '/app/__testing-utils__'

import { i18n } from '/app/i18n'
import * as Config from '/app/redux/config'
import { GeneralSettings } from '../GeneralSettings'
import { PrivacySettings } from '../PrivacySettings'
import { AdvancedSettings } from '../AdvancedSettings'
import { FeatureFlags } from '/app/organisms/Desktop/AppSettings/FeatureFlags'
import { AppSettings } from '..'

vi.mock('/app/redux/config')
vi.mock('../GeneralSettings')
vi.mock('../PrivacySettings')
vi.mock('../AdvancedSettings')
vi.mock('/app/organisms/Desktop/AppSettings/FeatureFlags')

const render = (path = '/'): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Routes>
        <Route path="/app-settings/:appSettingsTab" element={<AppSettings />} />
      </Routes>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}
describe('AppSettingsHeader', () => {
  beforeEach(() => {
    vi.mocked(Config.getDevtoolsEnabled).mockReturnValue(false)
    vi.mocked(GeneralSettings).mockReturnValue(<div>Mock General Settings</div>)
    vi.mocked(AdvancedSettings).mockReturnValue(
      <div>Mock Advanced Settings</div>
    )
    vi.mocked(FeatureFlags).mockReturnValue(<div>Mock Feature Flags</div>)
    vi.mocked(PrivacySettings).mockReturnValue(<div>Mock Privacy Settings</div>)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders correct title and navigation tabs', () => {
    const [{ getByText }] = render('/app-settings/general')
    getByText('App Settings')
    getByText('General')
    getByText('Privacy')
    getByText('Advanced')
  })
  it('does not render feature flags link if dev tools disabled', () => {
    const [{ queryByText }] = render('/app-settings/general')
    expect(queryByText('Feature Flags')).toBeFalsy()
  })
  it('renders feature flags link if dev tools enabled', () => {
    vi.mocked(Config.getDevtoolsEnabled).mockReturnValue(true)
    const [{ getByText }] = render('/app-settings/general')
    getByText('Feature Flags')
  })
})
