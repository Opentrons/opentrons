import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { QueryClient, QueryClientProvider } from 'react-query'

import { touchScreenViewport } from '../../DesignTokens/constants'
import { configReducer } from '../../redux/config/reducer'
import { EstopPressedModal } from '.'

import type { Store } from 'redux'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Organisms/EstopPressedModal',
  component: EstopPressedModal,
  parameters: touchScreenViewport,
} as Meta

const dummyConfig = {
  config: {
    isOnDevice: true,
  },
} as any

const store: Store<any> = createStore(configReducer, dummyConfig)
const queryClient = new QueryClient()

const Template: Story<
  React.ComponentProps<typeof EstopPressedModal>
> = args => (
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <EstopPressedModal {...args} />
    </Provider>
  </QueryClientProvider>
)

export const EstopPressed = Template.bind({})
EstopPressed.args = {
  isEngaged: true,
  closeModal: () => {},
}
