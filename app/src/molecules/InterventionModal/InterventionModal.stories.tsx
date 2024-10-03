import { Provider } from 'react-redux'
import { createStore } from 'redux'

import { LegacyStyledText } from '@opentrons/components'
import { configReducer } from '/app/redux/config/reducer'
import { InterventionModal as InterventionModalComponent } from './'

import type { Store, StoreEnhancer } from 'redux'
import type { Meta, StoryObj } from '@storybook/react'

const dummyConfig = {
  config: {
    isOnDevice: false,
  },
} as any
const store: Store<any> = createStore(
  configReducer,
  dummyConfig as StoreEnhancer
)

const meta: Meta<typeof InterventionModalComponent> = {
  title: 'App/Molecules/InterventionModal',
  component: InterventionModalComponent,
  decorators: [
    Story => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof InterventionModalComponent>

export const ErrorIntervention: Story = {
  args: {
    type: 'error',
    titleHeading: <LegacyStyledText as="h3">Oh no, an error!</LegacyStyledText>,
    iconName: 'alert-circle',
    children: (
      <LegacyStyledText as="p">{"Here's some error content"}</LegacyStyledText>
    ),
  },
}

export const InterventionRequiredIntervention: Story = {
  args: {
    type: 'intervention-required',
    titleHeading: (
      <LegacyStyledText as="h3">
        Looks like theres something to do
      </LegacyStyledText>
    ),
    children: (
      <LegacyStyledText as="p">{"You've got to intervene!"}</LegacyStyledText>
    ),
  },
}
