import type * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { QueryClient, QueryClientProvider } from 'react-query'

import { fixture96Plate } from '@opentrons/shared-data'

import { configReducer } from '/app/redux/config/reducer'
import { mockRunData } from './__fixtures__'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'
import * as DiscoveryClientFixtures from '../../../../discovery-client/src/fixtures'
import {
  HEALTH_STATUS_OK,
  ROBOT_MODEL_OT3,
} from '/app/redux/discovery/constants'
import { InterventionModal as InterventionModalComponent } from './'

import type { Store, StoreEnhancer } from 'redux'
import type { Story, Meta } from '@storybook/react'

const dummyConfig = {
  discovery: {
    robot: { connection: { connectedTo: null } },
    robotsByName: {
      [mockConnectableRobot.name]: mockConnectableRobot,
      buzz: {
        name: 'buzz',
        health: DiscoveryClientFixtures.mockOT3HealthResponse,
        serverHealth: DiscoveryClientFixtures.mockOT3ServerHealthResponse,
        addresses: [
          {
            ip: '1.1.1.1',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_OK,
            serverHealthStatus: HEALTH_STATUS_OK,
            healthError: null,
            serverHealthError: null,
            advertisedModel: ROBOT_MODEL_OT3,
          },
        ],
      },
    },
  },
} as any

const store: Store<any> = createStore(
  configReducer,
  dummyConfig as StoreEnhancer
)
const queryClient = new QueryClient()
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
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <InterventionModalComponent {...args} />
    </Provider>
  </QueryClientProvider>
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
        loadName: fixture96Plate.parameters.loadName,
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
          loadName: fixture96Plate.parameters.loadName,
          namespace: 'fixture',
          version: 1,
          location: { slotName: '9' },
        },
        result: {
          definition: fixture96Plate,
        },
      },
    ],
  },
}
