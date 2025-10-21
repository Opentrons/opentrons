import { Provider } from 'react-redux'
import { legacy_createStore } from 'redux'

import { EstopMissingModal } from '.'
import { configReducer } from '../../redux/config/reducer'

import type { Meta, Story } from '@storybook/react'
import type { Store, StoreEnhancer } from 'redux'
import type * as React from 'react'

export default {
  title: 'App/Organisms/EstopMissingModal',
  component: EstopMissingModal,
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

const Template: Story<
  React.ComponentProps<typeof EstopMissingModal>
> = args => (
  <Provider store={store}>
    <EstopMissingModal {...args} />
  </Provider>
)

export const EstopMissing = Template.bind({})
EstopMissing.args = {
  robotName: 'Flexy',
  closeModal: () => {},
  isDismissedModal: false,
  setIsDismissedModal: () => {},
}
