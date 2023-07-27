import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'

import { configReducer } from '../../redux/config/reducer'
import { EstopMissingModal } from '.'

import type { Store } from 'redux'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/organisms/EstopMissingModal',
  component: EstopMissingModal,
} as Meta

const dummyConfig = {
  config: {
    isOnDevice: true,
  },
} as any

const store: Store<any> = createStore(configReducer, dummyConfig)

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
}
