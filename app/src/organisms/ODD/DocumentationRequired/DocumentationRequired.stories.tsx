import { Provider } from 'react-redux'
import { legacy_createStore } from 'redux'
import { action } from 'storybook/actions'

import { VIEWPORT } from '@opentrons/components'

import { configReducer } from '/app/redux/config/reducer'

import { DocumentationRequired as DocumentationRequiredComponent } from '.'

import type { Meta, StoryObj } from '@storybook/react'
import type { Store, StoreEnhancer } from 'redux'

const dummyConfig = {
  config: {
    isOnDevice: true,
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

const meta: Meta<typeof DocumentationRequiredComponent> = {
  title: 'ODD/Organisms/DocumentationRequired',
  component: DocumentationRequiredComponent,
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

type Story = StoryObj<typeof DocumentationRequiredComponent>

export const DocumentationRequired: Story = {
  args: {
    userName: 'John Doe',
    onBack: action('onBack'),
  },
}
