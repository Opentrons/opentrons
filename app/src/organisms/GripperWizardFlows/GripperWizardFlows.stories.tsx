import type * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'
import * as DiscoveryClientFixtures from '../../../../discovery-client/src/fixtures'
import {
  HEALTH_STATUS_OK,
  ROBOT_MODEL_OT3,
} from '/app/redux/discovery/constants'
import { configReducer } from '/app/redux/config/reducer'
import { GripperWizardFlows } from './'

import type { Store, StoreEnhancer } from 'redux'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/organisms/GripperWizardFlows',
  component: GripperWizardFlows,
} as Meta

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

const Template: Story<
  React.ComponentProps<typeof GripperWizardFlows>
> = args => (
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <GripperWizardFlows {...args} />
    </Provider>
  </QueryClientProvider>
)

export const Attach = Template.bind({})
Attach.args = {
  flowType: 'ATTACH',
  closeFlow: () => {},
}

export const Detach = Template.bind({})
Detach.args = {
  flowType: 'DETACH',
  closeFlow: () => {},
}

export const Recalibrate = Template.bind({})
Recalibrate.args = {
  flowType: 'RECALIBRATE',
  closeFlow: () => {},
}
