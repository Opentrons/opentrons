import * as React from 'react'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import * as Config from '../../../redux/config'
import { GeneralSettings } from '../GeneralSettings'
import { AdvancedSettings } from '../AdvancedSettings'
import { FeatureFlags } from '../../../organisms/AppSettings/FeatureFlags'
import { AppSettings } from '..'

jest.mock('../../../redux/config')
jest.mock('../GeneralSettings')
jest.mock('../AdvancedSettings')
jest.mock('../../../organisms/AppSettings/FeatureFlags')

const getDevtoolsEnabled = Config.getDevtoolsEnabled as jest.MockedFunction<
  typeof Config.getDevtoolsEnabled
>
const mockGeneralSettings = GeneralSettings as jest.MockedFunction<
  typeof GeneralSettings
>
const mockAdvancedSettings = AdvancedSettings as jest.MockedFunction<
  typeof AdvancedSettings
>
const mockFeatureFlags = FeatureFlags as jest.MockedFunction<
  typeof FeatureFlags
>

const render = (path = '/'): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/app-settings/:appSettingsTab">
        <AppSettings />
      </Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}
describe('AppSettingsHeader', () => {
  beforeEach(() => {
    getDevtoolsEnabled.mockReturnValue(false)
    mockGeneralSettings.mockReturnValue(<div>Mock General Settings</div>)
    mockAdvancedSettings.mockReturnValue(<div>Mock Advanced Settings</div>)
    mockFeatureFlags.mockReturnValue(<div>Mock Feature Flags</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and navigation tabs', () => {
    const [{ getByText }] = render('/app-settings/general')
    getByText('App Settings')
    getByText('General')
    getByText('Advanced')
  })
  it('does not render feature flags link if dev tools disabled', () => {
    const [{ queryByText }] = render('/app-settings/general')
    expect(queryByText('Feature Flags')).toBeFalsy()
  })
  it('renders feature flags link if dev tools enabled', () => {
    getDevtoolsEnabled.mockReturnValue(true)
    const [{ getByText }] = render('/app-settings/general')
    getByText('Feature Flags')
  })
})
