import { Flex, STYLE_PROPS } from '../../primitives'
import { DIRECTION_ROW } from '../../styles'
import { SPACING } from '../../ui-style-constants'
import { Button as ButtonComponent } from './Button'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Helix/Atoms/Button',
  argTypes: {
    ...Object.fromEntries(
      [...STYLE_PROPS, 'as', 'ref', 'theme', 'forwardedAs'].map(prop => [
        prop,
        { table: { disable: true } },
      ])
    ),
    variant: {
      control: {
        type: 'select',
        options: ['default', 'alert', 'alt'],
      },
    },
    rounded: {
      control: {
        type: 'boolean',
      },
    },
    children: {
      control: {
        type: 'text',
      },
    },
    'aria-disabled': {
      control: {
        type: 'boolean',
      },
    },
    isDangerous: {
      control: {
        type: 'boolean',
      },
    },
  },
}

export default meta

export const DefaultButton: StoryObj<typeof ButtonComponent> = {
  args: {
    variant: 'default',
    rounded: false,
    children: 'primary button',
  },
  render: args => (
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing16}>
      <ButtonComponent {...args} />
    </Flex>
  ),
}

export const AlertButton: StoryObj<typeof ButtonComponent> = {
  args: {
    variant: 'alert',
    rounded: true,
    children: 'alert tertiary button',
  },
  render: args => (
    <Flex>
      <ButtonComponent {...args} />
    </Flex>
  ),
}

export const AltButton: StoryObj<typeof ButtonComponent> = {
  args: {
    variant: 'alt',
    rounded: false,
    children: 'alt primary button',
  },
  render: args => (
    <Flex>
      <ButtonComponent {...args} />
    </Flex>
  ),
}
