import { Box } from './Box'
import { NewPrimaryBtn, NewSecondaryBtn, TertiaryBtn } from './Btn'

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

const TertiaryTemplate: Story<
  React.ComponentProps<typeof TertiaryBtn>
> = args => <TertiaryBtn {...args} />
export const Tertiary = TertiaryTemplate.bind({})
Tertiary.decorators = [
  Story => (
    <Box backgroundColor="black" size="20rem" padding="2rem" id="hello">
      <Story />
    </Box>
  ),
]
Tertiary.args = {
  children: 'Perform Side-Effect',
  title: 'tertiary button title',
}
