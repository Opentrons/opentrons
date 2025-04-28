import { VIEWPORT } from '@opentrons/components'
import type { Meta, Story } from '@storybook/react'
import { configReducer } from '/app/redux/config/reducer'
import type * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import type { Store, StoreEnhancer } from 'redux'
import { EstopPressedModal } from '.'

export default {
  title: 'ODD/Organisms/EstopPressedModal',
  component: EstopPressedModal,
  parameters: VIEWPORT.touchScreenViewport,
} as Meta

const dummyConfig = {
  config: {
    isOnDevice: true,
  },
} as any

const store: Store<any> = createStore(
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
