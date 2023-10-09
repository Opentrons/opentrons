import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { configReducer } from '../../redux/config/reducer'
import { GripperWizardFlows } from './'

import type { Store } from 'redux'
import type { Story, Meta } from '@storybook/react'

const queryClient = new QueryClient()
const dummyConfig = {
  config: {
    isOnDevice: false,
  },
} as any
const store: Store<any> = createStore(configReducer, dummyConfig)

export default {
  title: 'App/organisms/GripperWizardFlows',
  component: GripperWizardFlows,
} as Meta

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
