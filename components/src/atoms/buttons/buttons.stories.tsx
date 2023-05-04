import { Flex } from '../../primitives'
import { DIRECTION_ROW } from '../../styles'
import { SPACING } from '../../ui-style-constants'
import { AlertPrimaryButton } from './AlertPrimaryButton'
import { PrimaryButton } from './PrimaryButton'
import { SecondaryButton } from './SecondaryButton'
import type { Story, Meta } from '@storybook/react'
import * as React from 'react'

export default {
  title: 'Library/Atoms/Buttons',
} as Meta

const PrimaryButtonTemplate: Story<
  React.ComponentProps<typeof PrimaryButton>
> = args => {
  const { children } = args
  return (
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing16}>
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
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing16}>
      <SecondaryButton>{children}</SecondaryButton>
    </Flex>
  )
}

export const Secondary = SecondaryButtonTemplate.bind({})
Secondary.args = {
  children: 'secondary button',
}

const AlertPrimaryButtonTemplate: Story<
  React.ComponentProps<typeof AlertPrimaryButton>
> = args => {
  const { children } = args
  return (
    <Flex>
      <AlertPrimaryButton>{children}</AlertPrimaryButton>
    </Flex>
  )
}

export const AlertPrimary = AlertPrimaryButtonTemplate.bind({})
AlertPrimary.args = {
  children: 'alert tertiary button',
}
