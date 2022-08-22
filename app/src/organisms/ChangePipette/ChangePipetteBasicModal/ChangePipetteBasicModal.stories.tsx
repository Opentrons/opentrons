import * as React from 'react'
import { COLORS, Flex } from '@opentrons/components'
import { PrimaryButton } from '../../../atoms/buttons'
import { WizardHeader } from '../../../molecules/WizardHeader'
import { ModalShell } from '../../../molecules/Modal'

import { ChangePipetteBasicModal } from './index'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Organisms/ChangePipette/ChangePipetteBasicModal',
  component: ChangePipetteBasicModal,
} as Meta

const Template: Story<
  React.ComponentProps<typeof ChangePipetteBasicModal>
> = args => (
  <ModalShell width="47rem">
    <Flex flexDirection="column">
      <WizardHeader
        currentStep={4}
        totalSteps={7}
        title="Attach a pipette"
        onExit={() => console.log('exit')}
      />
      <ChangePipetteBasicModal {...args} />
    </Flex>
  </ModalShell>
)
export const Primary = Template.bind({})
Primary.args = {
  iconColor: COLORS.errorEnabled,
  header: 'Pipette still detected',
  subHeader: 'Are you sure you want to exit before detaching your pipette?',
  isSuccess: false,
  children: <PrimaryButton>{'Exit'}</PrimaryButton>,
}
