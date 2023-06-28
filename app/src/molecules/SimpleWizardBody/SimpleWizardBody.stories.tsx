import * as React from 'react'
import { COLORS, PrimaryButton } from '@opentrons/components'
import { LegacyModalShell } from '../LegacyModal'
import { WizardHeader } from '../WizardHeader'
import { SimpleWizardBody } from './index'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Molecules/SimpleWizardBody',
  component: SimpleWizardBody,
} as Meta

const Template: Story<React.ComponentProps<typeof SimpleWizardBody>> = args => (
  <LegacyModalShell>
    <WizardHeader currentStep={3} totalSteps={4} title="Attach a pipette" />
    <SimpleWizardBody {...args} />
  </LegacyModalShell>
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
