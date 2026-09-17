import { Provider } from 'react-redux'
import { legacy_createStore } from 'redux'

import { VIEWPORT } from '@opentrons/components'

import { configReducer } from '/app/redux/config/reducer'

import { EstopMissingModal } from '.'

import type { Meta, Story } from '@storybook/react'
import type { Store, StoreEnhancer } from 'redux'
import type * as React from 'react'

export default {
  title: 'ODD/Organisms/EstopMissingModal',
  component: EstopMissingModal,
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
