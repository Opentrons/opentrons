import * as React from 'react'
import { COLORS } from '@opentrons/components'
import { PrimaryButton } from '../../atoms/buttons'
import { ModalShell } from '../Modal'
import { WizardHeader } from '../WizardHeader'
import { SimpleWizardBody } from './index'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Molecules/SimpleWizardBody',
  component: SimpleWizardBody,
} as Meta

const Template: Story<React.ComponentProps<typeof SimpleWizardBody>> = args => (
  <ModalShell>
    <WizardHeader currentStep={3} totalSteps={4} title="Attach a pipette" />
    <SimpleWizardBody {...args} />
  </ModalShell>
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
