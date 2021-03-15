import * as React from 'react'
import { PrimaryBtn, SecondaryBtn, LightSecondaryBtn, TertiaryBtn } from './Btn'
import { Box } from './Box'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Atoms/Btn',
  argTypes: { onClick: { action: 'clicked' } },
} as Meta

const PrimaryTemplate: Story<
  React.ComponentProps<typeof PrimaryBtn>
> = args => <PrimaryBtn {...args} />
export const Primary = PrimaryTemplate.bind({})
Primary.args = {
  children: 'Confirm and Proceed',
  title: 'primary button title',
}

const SecondaryTemplate: Story<
  React.ComponentProps<typeof SecondaryBtn>
> = args => <SecondaryBtn {...args} />
export const Secondary = SecondaryTemplate.bind({})
Secondary.args = {
  children: 'Cancel',
  title: 'secondary button title',
}

const LightSecondaryTemplate: Story<
  React.ComponentProps<typeof LightSecondaryBtn>
> = args => (
  <Box backgroundColor="black" size="20rem" padding="2rem">
    <LightSecondaryBtn {...args} />
  </Box>
)
export const LightSecondary = LightSecondaryTemplate.bind({})
LightSecondary.args = {
  children: 'Cancel',
  title: 'secondary button title',
}

const TertiaryTemplate: Story<
  React.ComponentProps<typeof TertiaryBtn>
> = args => <TertiaryBtn {...args} />
export const Tertiary = TertiaryTemplate.bind({})
Tertiary.args = {
  children: 'Button Skeleton',
  title: 'raw button title',
}
