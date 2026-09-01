import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { legacy_createStore } from 'redux'

import { VIEWPORT } from '@opentrons/components'

import { configReducer } from '/app/redux/config/reducer'

import { EstopPressedModal } from '.'

import type { Meta, Story } from '@storybook/react'
import type { Store, StoreEnhancer } from 'redux'
import type * as React from 'react'

export default {
  title: 'ODD/Organisms/EstopPressedModal',
  component: EstopPressedModal,
  ...VIEWPORT.touchScreenViewport,
} as Meta

const dummyConfig = {
  config: {
    isOnDevice: true,
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
}
