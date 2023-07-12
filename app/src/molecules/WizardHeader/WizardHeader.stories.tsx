import * as React from 'react'
import { WizardHeader } from './index'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Molecules/WizardHeader',
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
}

export const CurrentStepZero = Template.bind({})
CurrentStepZero.args = {
  totalSteps: 5,
  currentStep: 0,
  title: 'Tip Length Calibration',
}

export const ErrorState = Template.bind({})
ErrorState.args = {
  totalSteps: 5,
  currentStep: 1,
  isErrorState: true,
  title: 'Tip Length Calibration',
}
