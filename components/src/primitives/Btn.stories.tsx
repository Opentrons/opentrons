import * as React from 'react'
import {
  PrimaryBtn,
  SecondaryBtn,
  AppPrimaryBtn,
  AppSecondaryBtn,
  AppAlertPrimaryBtn,
  AppAlertSecondaryBtn,
  LightSecondaryBtn,
  TertiaryBtn,
} from './Btn'
import { Box } from './Box'

import type { Story, Meta } from '@storybook/react'

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

const AppPrimaryTemlate: Story<
  React.ComponentProps<typeof AppPrimaryBtn>
> = args => <AppPrimaryBtn {...args} />
export const AppPrimary = AppPrimaryTemlate.bind({})
AppPrimary.args = {
  children: 'Confirm and Proceed',
  title: 'app primary button title',
}

const AppSecondaryTemlate: Story<
  React.ComponentProps<typeof AppSecondaryBtn>
> = args => <AppSecondaryBtn {...args} />
export const AppSecondary = AppSecondaryTemlate.bind({})
AppSecondary.args = {
  children: 'Confirm and Proceed',
  title: 'app secondary button title',
}

const AppAlertPrimaryTemlate: Story<
  React.ComponentProps<typeof AppAlertPrimaryBtn>
> = args => <AppAlertPrimaryBtn {...args} />
export const AppAlertPrimary = AppAlertPrimaryTemlate.bind({})
AppAlertPrimary.args = {
  children: 'Cancel',
  title: 'app alert primary button title',
}

const AppAlertSecondaryTemlate: Story<
  React.ComponentProps<typeof AppAlertSecondaryBtn>
> = args => <AppAlertSecondaryBtn {...args} />
export const AppAlertSecondary = AppAlertSecondaryTemlate.bind({})
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
