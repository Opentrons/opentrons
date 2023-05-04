import { GripperWizardFlows } from './'
import type { Story, Meta } from '@storybook/react'
import * as React from 'react'

export default {
  title: 'App/organisms/GripperWizardFlows',
  component: GripperWizardFlows,
} as Meta

const Template: Story<
  React.ComponentProps<typeof GripperWizardFlows>
> = args => <GripperWizardFlows {...args} />

export const Attach = Template.bind({})
Attach.args = {
  flowType: 'ATTACH',
  closeFlow: () => {},
}

export const Detach = Template.bind({})
Detach.args = {
  flowType: 'DETACH',
  closeFlow: () => {},
}

export const Recalibrate = Template.bind({})
Recalibrate.args = {
  flowType: 'RECALIBRATE',
  closeFlow: () => {},
}
