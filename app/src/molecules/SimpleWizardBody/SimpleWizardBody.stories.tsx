import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { COLORS, PrimaryButton } from '@opentrons/components'
import { LegacyModalShell } from '../LegacyModal'
import { WizardHeader } from '../WizardHeader'
import { configReducer } from '../../redux/config/reducer'
import { SimpleWizardBody } from './index'

import type { Store } from 'redux'
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

const store: Store<any> = createStore(configReducer, dummyConfig)

const Template: Story<React.ComponentProps<typeof SimpleWizardBody>> = args => (
  <Provider store={store}>
    <LegacyModalShell>
      <WizardHeader currentStep={3} totalSteps={4} title="Attach a pipette" />
      <SimpleWizardBody {...args} />
    </LegacyModalShell>
  </Provider>
)

export const AlertIcon = Template.bind({})
AlertIcon.args = {
  iconColor: COLORS.errorEnabled,
  header: 'Pipette still detected',
  subHeader: 'Are you sure you want to exit before detaching your pipette?',
  isSuccess: false,
  children: <PrimaryButton>{'Exit'}</PrimaryButton>,
}

export const SuccessIcon = Template.bind({})
SuccessIcon.args = {
  iconColor: COLORS.successEnabled,
  header: 'Pipette still detected',
  subHeader: 'Are you sure you want to exit before detaching your pipette?',
  isSuccess: true,
  children: <PrimaryButton>{'Exit'}</PrimaryButton>,
}
