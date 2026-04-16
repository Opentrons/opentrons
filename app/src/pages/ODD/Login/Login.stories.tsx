import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { legacy_createStore } from 'redux'

import { ApiHostProvider } from '@opentrons/react-api-client'
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

const queryClient = new QueryClient()

const meta: Meta<typeof LoginComponent> = {
  title: 'ODD/Pages/Login',
  component: LoginComponent,
  parameters: VIEWPORT.touchScreenViewport,
  decorators: [
    Story => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ApiHostProvider hostname="127.0.0.1">
            <MemoryRouter>
              <Story />
            </MemoryRouter>
          </ApiHostProvider>
        </QueryClientProvider>
      </Provider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof LoginComponent>

export const Default: Story = {}
