import * as React from 'react'
import { MediumButtonRounded } from '.'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/Buttons/MediumButtonRounded',
  argTypes: { onClick: { action: 'clicked' } },
} as Meta

const MediumButtonRoundedTemplate: Story<
  React.ComponentProps<typeof MediumButtonRounded>
> = args => <MediumButtonRounded {...args} />
export const MediumRounded = MediumButtonRoundedTemplate.bind({})
MediumRounded.args = {
  children: 'Button text',
  title: 'medium button rounded',
}
