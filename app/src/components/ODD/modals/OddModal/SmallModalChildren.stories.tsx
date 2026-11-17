import { VIEWPORT } from '@opentrons/components'

import { SmallModalChildren } from './SmallModalChildren'

import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'

export default {
  title: 'ODD/Molecules/Modals/SmallModalChildren',
  argTypes: { onClick: { action: 'clicked' } },
  ...VIEWPORT.touchScreenViewport,
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
