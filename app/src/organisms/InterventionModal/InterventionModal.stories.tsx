import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import { configReducer } from '../../redux/config/reducer'
import { mockRunData } from './__fixtures__'
import { InterventionModal as InterventionModalComponent } from './'

import type { Store } from 'redux'
import type { Story, Meta } from '@storybook/react'

const dummyConfig = {
  config: {
    isOnDevice: false,
  },
} as any

const store: Store<any> = createStore(configReducer, dummyConfig)

const now = new Date()

const pauseCommand = {
  commandType: 'waitForResume',
  params: {
    startedAt: now,
    message:
      'This is a user generated message that gives details about the pause command. This text is truncated to 220 characters. semper risus in hendrerit gravida rutrum quisque non tellus orci ac auctor augue mauris augue neque gravida in fermentum et sollicitudin ac orci phasellus egestas tellus rutrum tellus pellentesque',
  },
}

export default {
  title: 'App/Organisms/InterventionModal',
  component: InterventionModalComponent,
} as Meta

const Template: Story<
  React.ComponentProps<typeof InterventionModalComponent>
> = args => (
  <Provider store={store}>
    <InterventionModalComponent {...args} />
  </Provider>
)

export const PauseIntervention = Template.bind({})
PauseIntervention.args = {
  robotName: 'Otie',
  command: pauseCommand,
  run: mockRunData,
}

export const MoveLabwareIntervention = Template.bind({})
MoveLabwareIntervention.args = {
  robotName: 'Otie',
  command: {
    commandType: 'moveLabware',
    params: {
      labwareId: 'fake_labware_id',
      newLocation: {
        slotName: '1',
      },
    },
  },
  run: {
    ...mockRunData,
    labware: [
      {
        id: 'fake_labware_id',
        loadName: fixture_96_plate.parameters.loadName,
        definitionUri: 'fixture/fixture_96_plate/1',
        location: {
          slotName: '9',
        },
      },
    ],
  },
  analysis: {
    commands: [
      {
        commandType: 'loadLabware',
        params: {
          displayName: 'fake display name',
          labwareId: 'fake_labware_id',
          loadName: fixture_96_plate.parameters.loadName,
          namespace: 'fixture',
          version: 1,
          location: { slotName: '9' },
        },
        result: {
          definition: fixture_96_plate,
        },
      },
    ],
  },
}
