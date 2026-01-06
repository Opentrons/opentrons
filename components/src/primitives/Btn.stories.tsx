import { NewPrimaryBtn } from './Buttons/NewPrimaryBtn'
import { NewSecondaryBtn } from './Buttons/NewSecondaryBtn'

import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'

export default {
  title: 'Library/Atoms/Btn',
  argTypes: { onClick: { action: 'clicked' } },
} as Meta

const AppPrimaryTemplate: Story<
  React.ComponentProps<typeof NewPrimaryBtn>
> = args => <NewPrimaryBtn {...args} />
export const AppPrimary = AppPrimaryTemplate.bind({})
AppPrimary.args = {
  children: 'Confirm and Proceed',
  title: 'app primary button title',
}

const AppSecondaryTemplate: Story<
  React.ComponentProps<typeof NewSecondaryBtn>
> = args => <NewSecondaryBtn {...args} />
export const AppSecondary = AppSecondaryTemplate.bind({})
AppSecondary.args = {
  children: 'Confirm and Proceed',
  title: 'app secondary button title',
}
