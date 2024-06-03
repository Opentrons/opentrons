import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'

import { StyledText } from '@opentrons/components'
import { configReducer } from '../../redux/config/reducer'
import { InterventionModal as InterventionModalComponent } from './'

import type { Store } from 'redux'
import type { Meta, StoryObj } from '@storybook/react'

const dummyConfig = {
  config: {
    isOnDevice: false,
  },
} as any
const store: Store<any> = createStore(configReducer, dummyConfig)

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
    titleHeading: <StyledText as="h3">Oh no, an error!</StyledText>,
    iconName: 'alert-circle',
    children: <StyledText as="p">{"Here's some error content"}</StyledText>,
  },
}

export const InterventionRequiredIntervention: Story = {
  args: {
    type: 'intervention-required',
    titleHeading: (
      <StyledText as="h3">Looks like theres something to do</StyledText>
    ),
    children: <StyledText as="p">{"You've got to intervene!"}</StyledText>,
  },
}
