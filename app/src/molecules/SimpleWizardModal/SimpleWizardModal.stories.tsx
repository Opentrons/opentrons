import * as React from 'react'
import { COLORS, Flex, DIRECTION_COLUMN } from '@opentrons/components'
import { TEMPERATURE_MODULE_V1 } from '@opentrons/shared-data'
import { PrimaryButton } from '../../atoms/buttons'
import { WizardHeader } from '../WizardHeader'
import { ModalShell } from '../Modal'
import { SimpleWizardModal } from './index'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Molecules/SimpleWizardModal',
  component: SimpleWizardModal,
} as Meta

const WithWizardHeaderTemplate: Story<
  React.ComponentProps<typeof SimpleWizardModal>
> = args => (
  <ModalShell width="47rem">
    <Flex flexDirection={DIRECTION_COLUMN}>
      <WizardHeader
        currentStep={4}
        totalSteps={7}
        title="Attach a pipette"
        onExit={() => console.log('exit')}
      />
      <SimpleWizardModal {...args} />
    </Flex>
  </ModalShell>
)
export const WithWizardHeader = WithWizardHeaderTemplate.bind({})
WithWizardHeader.args = {
  iconColor: COLORS.errorEnabled,
  header: 'Pipette still detected',
  subHeader: 'Are you sure you want to exit before detaching your pipette?',
  isSuccess: false,
  children: <PrimaryButton>{'Exit'}</PrimaryButton>,
}

const Template: Story<
  React.ComponentProps<typeof SimpleWizardModal>
> = args => <SimpleWizardModal {...args} />

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
  iconColor: COLORS.errorEnabled,
  header: 'Pipette still detected',
  subHeader: 'Are you sure you want to exit before detaching your pipette?',
  isSuccess: TEMPERATURE_MODULE_V1,
  children: <PrimaryButton>{'Exit'}</PrimaryButton>,
}
