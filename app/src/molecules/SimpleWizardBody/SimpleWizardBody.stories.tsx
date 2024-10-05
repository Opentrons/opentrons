import type * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { COLORS, PrimaryButton, ModalShell } from '@opentrons/components'
import { WizardHeader } from '../WizardHeader'
import { configReducer } from '/app/redux/config/reducer'
import { SimpleWizardBody } from './index'

import type { Store, StoreEnhancer } from 'redux'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Molecules/SimpleWizardBody',
  component: SimpleWizardBody,
} as Meta

const dummyConfig = {
  config: {
    isOnDevice: false,
  },
} as any

const store: Store<any> = createStore(
  configReducer,
  dummyConfig as StoreEnhancer
)

const Template: Story<React.ComponentProps<typeof SimpleWizardBody>> = args => (
  <Provider store={store}>
    <ModalShell>
      <WizardHeader currentStep={3} totalSteps={4} title="Attach a pipette" />
      <SimpleWizardBody {...args} />
    </ModalShell>
  </Provider>
)

export const AlertIcon = Template.bind({})
AlertIcon.args = {
  iconColor: COLORS.red50,
  header: 'Pipette still detected',
  subHeader: 'Are you sure you want to exit before detaching your pipette?',
  isSuccess: false,
  children: <PrimaryButton>{'Exit'}</PrimaryButton>,
}

export const SuccessIcon = Template.bind({})
SuccessIcon.args = {
  iconColor: COLORS.green50,
  header: 'Pipette still detected',
  subHeader: 'Are you sure you want to exit before detaching your pipette?',
  isSuccess: true,
  children: <PrimaryButton>{'Exit'}</PrimaryButton>,
}
