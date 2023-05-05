import * as React from 'react'
import type { Story, Meta } from '@storybook/react'

import { StepMeter } from './index'

export default {
  title: 'App/Atoms/StepMeter',
  component: StepMeter,
} as Meta

const Template: Story<React.ComponentProps<typeof StepMeter>> = args => (
  <StepMeter {...args} />
)

export const Primary = Template.bind({})
Primary.args = {
  totalSteps: 5,
  currentStep: 2,
}
