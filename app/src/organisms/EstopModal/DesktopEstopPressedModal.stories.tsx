import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'

import { configReducer } from '../../redux/config/reducer'
import { EstopPressedModal } from '.'

import type { Store } from 'redux'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/organisms/EstopPressedModal',
  component: EstopPressedModal,
} as Meta

const dummyConfig = {
  config: {
    isOnDevice: false,
  },
} as any

const store: Store<any> = createStore(configReducer, dummyConfig)

const Template: Story<
  React.ComponentProps<typeof EstopPressedModal>
> = args => (
  <Provider store={store}>
    <EstopPressedModal {...args} />
  </Provider>
)

export const EstopPressed = Template.bind({})
EstopPressed.args = {
  isEngaged: true,
}
