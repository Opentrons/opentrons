import { I18nextProvider } from 'react-i18next'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { legacy_createStore } from 'redux'
import { action } from 'storybook/actions'

import { VIEWPORT } from '@opentrons/components'

import { i18n } from '/app/i18n'
import { configReducer } from '/app/redux/config/reducer'

import { OnDeviceLogin } from '.'

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

const meta: Meta<typeof OnDeviceLogin> = {
  title: 'ODD/Organisms/OnDeviceLogin',
  component: OnDeviceLogin,
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

type Story = StoryObj<typeof OnDeviceLogin>

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
    loginError: i18n.t('login_error_incorrect', {
      ns: 'access_control',
    }),
    onClearLoginError: action('onClearLoginError'),
  },
}

/** Choose a new password after signing in with a temporary password. */
export const PasswordResetRequired: Story = {
  args: {
    ...Default.args,
    step: 'password',
    isPasswordResetRequired: true,
    initialUsername: 'alice',
  },
}

/** Confirm-password step in the reset-password flow. */
export const PasswordResetConfirmPassword: Story = {
  args: {
    ...Default.args,
    step: 'confirmPassword',
    isPasswordResetRequired: true,
    initialUsername: 'alice',
  },
}
