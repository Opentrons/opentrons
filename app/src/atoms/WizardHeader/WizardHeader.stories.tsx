import * as React from 'react'
import {
  Flex,
  DIRECTION_ROW,
  JUSTIFY_FLEX_END,
  DIRECTION_COLUMN,
  COLORS,
  SPACING,
} from '@opentrons/components'
import { PrimaryButton, SecondaryButton } from '../buttons/index'
import { WizardHeader } from './index'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/WizardHeader',
  component: WizardHeader,
} as Meta

const Template: Story<React.ComponentProps<typeof WizardHeader>> = args => (
  <WizardHeader {...args} />
)

export const Primary = Template.bind({})
Primary.args = {
  totalSteps: 5,
  currentStep: 2,
  title: 'Tip Length Calibration',
  body: (
    <Flex flexDirection={DIRECTION_COLUMN}>
      {'this is the body part of the Wizard'}
    </Flex>
  ),
  footer: (
    <Flex flexDirection={DIRECTION_ROW} justifyContent={JUSTIFY_FLEX_END}>
      <Flex marginRight={SPACING.spacing4}>
        <PrimaryButton backgroundColor={COLORS.blue}>{'Back'}</PrimaryButton>
      </Flex>
      <SecondaryButton color={COLORS.blue}>{'Proceed'}</SecondaryButton>
    </Flex>
  ),
  showStepCount: true,
}

export const NoStepCount = Template.bind({})
NoStepCount.args = {
  totalSteps: 5,
  currentStep: 0,
  title: 'Tip Length Calibration',
  body: (
    <Flex flexDirection={DIRECTION_COLUMN}>
      {'this is the body part of the StepMeter'}
    </Flex>
  ),
  footer: (
    <Flex flexDirection={DIRECTION_ROW} justifyContent={JUSTIFY_FLEX_END}>
      <Flex marginRight={SPACING.spacing4}>
        <PrimaryButton backgroundColor={COLORS.blue}>{'Back'}</PrimaryButton>
      </Flex>
      <SecondaryButton color={COLORS.blue}>{'Proceed'}</SecondaryButton>
    </Flex>
  ),
}
