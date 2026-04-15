import { Provider } from 'react-redux'
import { legacy_createStore } from 'redux'

import { VIEWPORT } from '@opentrons/components'

import { configReducer } from '/app/redux/config/reducer'

import { Login as LoginComponent } from '.'

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

const meta: Meta<typeof LoginComponent> = {
  title: 'ODD/Pages/Login',
  component: LoginComponent,
  parameters: VIEWPORT.touchScreenViewport,
  decorators: [
    Story => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof LoginComponent>

export const Default: Story = {}
