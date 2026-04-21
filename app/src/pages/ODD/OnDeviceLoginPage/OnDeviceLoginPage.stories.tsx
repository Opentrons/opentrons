import { I18nextProvider } from 'react-i18next'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { action } from '@storybook/addon-actions'
import { legacy_createStore } from 'redux'

import { VIEWPORT } from '@opentrons/components'

import { i18n } from '/app/i18n'
import { configReducer } from '/app/redux/config/reducer'

import { OnDeviceLoginPageView } from '.'

import type { Meta, StoryObj } from '@storybook/react'
import type { Store, StoreEnhancer } from 'redux'

const dummyConfig = {
  config: {
    isOnDevice: false,
    language: {
      appLanguage: 'en',
      systemLanguage: null,
    },
  },
} as any
const store: Store<any> = legacy_createStore(
  configReducer,
  dummyConfig as StoreEnhancer
)

const meta: Meta<typeof OnDeviceLoginPageView> = {
  title: 'ODD/Pages/Login',
  component: OnDeviceLoginPageView,
  parameters: VIEWPORT.touchScreenViewport,
  decorators: [
    Story => (
      <Provider store={store}>
        <MemoryRouter>
          <I18nextProvider i18n={i18n}>
            <Story />
          </I18nextProvider>
        </MemoryRouter>
      </Provider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof OnDeviceLoginPageView>

export const Default: Story = {
  args: {
    step: 'username',
    onStepChange: action('onStepChange'),
    submitPassword: action('submitPassword') as (
      username: string,
      password: string
    ) => void,
    isAuthLoading: false,
    onCancel: action('onCancel'),
    loginError: null,
    onClearLoginError: action('onClearLoginError'),
  },
}

/** Password step with inline error */
export const WithLoginError: Story = {
  args: {
    ...Default.args,
    step: 'password',
    loginError: i18n.t('on_device_login_error_incorrect', {
      ns: 'device_settings',
    }),
    onClearLoginError: action('onClearLoginError'),
  },
}
