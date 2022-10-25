import * as React from 'react'
import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { ModalShell } from '../Modal'
import { WizardHeader } from '../WizardHeader'
import { GenericWizardTile } from './index'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Molecules/GenericWizardTile',
  component: GenericWizardTile,
} as Meta

const Template: Story<
  React.ComponentProps<typeof GenericWizardTile>
> = args => (
  <ModalShell>
    <WizardHeader currentStep={3} totalSteps={4} title="Example Title" />
    <GenericWizardTile {...args} />
  </ModalShell>
)
const body = (
  <StyledText as="p">
    {
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    }
  </StyledText>
)
const rightHandBody = (
  <Flex flexDirection={DIRECTION_COLUMN}>
    <StyledText as="h1">{'You will need:'}</StyledText>
    <StyledText as="p" marginTop={SPACING.spacing4}>
      {'this'}
    </StyledText>
    <StyledText as="p">{'and this'}</StyledText>
    <StyledText as="p">{'and this'}</StyledText>
  </Flex>
)
export const WithGetHelpLink = Template.bind({})
WithGetHelpLink.args = {
  rightHandBody: rightHandBody,
  bodyText: body,
  header: 'example header',
  getHelp: 'url for the help link',
  proceedButtonText: 'Continue',
}

export const WithBackButton = Template.bind({})
WithBackButton.args = {
  rightHandBody: rightHandBody,
  bodyText: body,
  header: 'example header',
  back: () => console.log('back'),
  proceedButtonText: 'Continue',
}
