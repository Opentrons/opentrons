import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { legacy_createStore } from 'redux'

import { VIEWPORT } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'

import { configReducer } from '/app/redux/config/reducer'

import { AddFixtureModal } from './AddFixtureModal'

import type { Meta, Story } from '@storybook/react'
import type { Store, StoreEnhancer } from 'redux'

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

export default {
  title: 'ODD/Organisms/AddFixtureModal',
  argTypes: {
    modalSize: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
    },
    onOutsideClick: { action: 'clicked' },
  },
  ...VIEWPORT.touchScreenViewport,
  decorators: [
    Story => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      </Provider>
    ),
  ],
} as Meta

const Template: Story<React.ComponentProps<typeof AddFixtureModal>> = args => (
  <AddFixtureModal {...args} />
)

export const Default = Template.bind({})
Default.args = {
  cutoutId: 'cutoutD3',
  addressableAreaId: 'D3',
  closeModal: () => {},
  isOnDevice: true,
  deckDef: getDeckDefFromRobotType(FLEX_ROBOT_TYPE),
}
