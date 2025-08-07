import { Box } from './Box'
import {
  LightSecondaryBtn,
  NewAlertSecondaryBtn,
  NewPrimaryBtn,
  NewSecondaryBtn,
  PrimaryBtn,
  SecondaryBtn,
  TertiaryBtn,
} from './Btn'

import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'

export default {
  title: 'Library/Atoms/Btn',
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

const AppAlertSecondaryTemplate: Story<
  React.ComponentProps<typeof NewAlertSecondaryBtn>
> = args => <NewAlertSecondaryBtn {...args} />
export const AppAlertSecondary = AppAlertSecondaryTemplate.bind({})
AppAlertSecondary.args = {
  children: 'Cancel',
  title: 'app alert secondary button title',
}

const LightSecondaryTemplate: Story<
  React.ComponentProps<typeof LightSecondaryBtn>
> = args => <LightSecondaryBtn {...args} />
export const LightSecondary = LightSecondaryTemplate.bind({})
LightSecondary.decorators = [
  Story => (
    <Box backgroundColor="black" size="20rem" padding="2rem">
      <Story />
    </Box>
  ),
]
LightSecondary.args = {
  children: 'Cancel',
  title: 'secondary button title',
}

const TertiaryTemplate: Story<
  React.ComponentProps<typeof TertiaryBtn>
> = args => <TertiaryBtn {...args} />
TertiaryTemplate.decorators = [
  Story => (
    <Box backgroundColor="black" size="20rem" padding="2rem">
      <Story />
    </Box>
  ),
]
export const Tertiary = TertiaryTemplate.bind({})
Tertiary.args = {
  children: 'Perform Side-Effect',
  title: 'tertiary button title',
}
