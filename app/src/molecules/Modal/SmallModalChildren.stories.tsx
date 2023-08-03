import * as React from 'react'
import { SmallModalChildren } from './SmallModalChildren'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Molecules/Modals/SmallModalChildren',
  argTypes: { onClick: { action: 'clicked' } },
} as Meta

const Template: Story<
  React.ComponentProps<typeof SmallModalChildren>
> = args => <SmallModalChildren {...args} />
export const Default = Template.bind({})
Default.args = {
  header: 'Header',
  subText: 'subText',
  buttonText: 'buttonText',
}
