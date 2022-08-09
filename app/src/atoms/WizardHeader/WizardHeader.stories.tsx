import * as React from 'react'
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
}
