import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { legacy_createStore } from 'redux'

import { EstopPressedModal } from '.'
import { configReducer } from '../../redux/config/reducer'

import type { Meta, Story } from '@storybook/react'
import type { Store, StoreEnhancer } from 'redux'
import type * as React from 'react'

export default {
  title: 'App/Organisms/EstopPressedModal',
  component: EstopPressedModal,
} as Meta

const dummyConfig = {
  config: {
    isOnDevice: false,
  },
} as any

const store: Store<any> = legacy_createStore(
  configReducer,
  dummyConfig as StoreEnhancer
)
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
  setIsDismissedModal: () => {},
}
