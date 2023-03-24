import * as React from 'react'
import { Flex, DIRECTION_ROW, SPACING } from '../../index'
import { PrimaryButton } from './PrimaryButton'
import { SecondaryButton } from './SecondaryButton'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Atoms/Buttons',
} as Meta

const PrimaryButtonTemplate: Story<
  React.ComponentProps<typeof PrimaryButton>
> = args => {
  const { children } = args
  return (
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing4}>
      <PrimaryButton>{children}</PrimaryButton>
    </Flex>
  )
}

export const Primary = PrimaryButtonTemplate.bind({})
Primary.args = {
  children: 'primary button',
}

const SecondaryButtonTemplate: Story<
  React.ComponentProps<typeof SecondaryButton>
> = args => {
  const { children } = args
  return (
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing4}>
      <SecondaryButton>{children}</SecondaryButton>
    </Flex>
  )
}

export const Secondary = SecondaryButtonTemplate.bind({})
Secondary.args = {
  children: 'secondary button',
}
