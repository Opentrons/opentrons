import * as React from 'react'
import { LegacyAlertItem } from './'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Molecules/LegacyAlertItem',
  component: LegacyAlertItem,
  argTypes: { onCloseClick: { action: 'clicked' } },
} as Meta

const Template: Story<React.ComponentProps<typeof LegacyAlertItem>> = args => (
  <LegacyAlertItem {...args} />
)

export const Basic = Template.bind({})
Basic.args = {
  type: 'success',
  title: 'good job!',
}

export const OverriddenIcon = Template.bind({})
OverriddenIcon.args = {
  type: 'info',
  title: 'Alert with overridden icon',
  icon: { name: 'pause-circle' },
}

export const Stackable: Story<
  React.ComponentProps<typeof LegacyAlertItem>
> = args => (
  <div>
    <Template {...args} type="warning" title={'Warning with close button'} />
    <Template
      {...args}
      onCloseClick={undefined}
      type="warning"
      title={'Warning with no close button'}
    />
    <Template {...args} type="warning" title={'Warning with no children'} />
    <Template
      {...args}
      type="warning"
      title={'Warning with React Node children'}
    >
      <p>Some additional info</p>
    </Template>
  </div>
)
