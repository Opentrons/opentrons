import type * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'

import { VIEWPORT } from '@opentrons/components'

import { configReducer } from '/app/redux/config/reducer'
import { EstopMissingModal } from '.'

import type { Store, StoreEnhancer } from 'redux'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Organisms/EstopMissingModal',
  component: EstopMissingModal,
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
