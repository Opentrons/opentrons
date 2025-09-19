import { ICON_DATA_BY_NAME } from '../../icons/icon-data'
import { Flex, STYLE_PROPS } from '../../primitives'
import { DIRECTION_ROW } from '../../styles'
import { SPACING } from '../../ui-style-constants'
import { AlertPrimaryButton as AlertPrimaryButtonComponent } from './AlertPrimaryButton'
import { AltPrimaryButton as AltPrimaryButtonComponent } from './AltPrimaryButton'
import { BasicButton as BasicButtonComponent } from './BasicButton'
import { PrimaryButton as PrimaryButtonComponent } from './PrimaryButton'
import { SecondaryButton as SecondaryButtonComponent } from './SecondaryButton'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Helix/Atoms/Buttons',
  argTypes: {
    ...Object.fromEntries(
      [...STYLE_PROPS, 'as', 'ref', 'theme', 'forwardedAs'].map(prop => [
        prop,
        { table: { disable: true } },
      ])
    ),
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

export const PrimaryButton: StoryObj<typeof PrimaryButtonComponent> = {
  args: {
    children: 'primary button',
  },
  render: args => (
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing16}>
      <PrimaryButtonComponent {...args} />
    </Flex>
  ),
}

export const SecondaryButton: StoryObj<typeof SecondaryButtonComponent> = {
  args: {
    children: 'secondary button',
  },
  render: args => (
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing16}>
      <SecondaryButtonComponent {...args} />
    </Flex>
  ),
}

export const AlertPrimaryButton: StoryObj<
  typeof AlertPrimaryButtonComponent
> = {
  args: {
    children: 'alert tertiary button',
  },
  render: args => (
    <Flex>
      <AlertPrimaryButtonComponent {...args} />
    </Flex>
  ),
}

export const AltPrimaryButton: StoryObj<typeof AltPrimaryButtonComponent> = {
  args: {
    children: 'alt primary button',
  },
  render: args => (
    <Flex>
      <AltPrimaryButtonComponent {...args} />
    </Flex>
  ),
}

export const BasicButton: StoryObj<typeof BasicButtonComponent> = {
  args: {
    children: 'basic button',
  },
  argTypes: {
    underLine: {
      control: {
        type: 'boolean',
      },
      description:
        'Toggles the underline style for the button text (BasicButton only).',
    },
    iconName: {
      options: Object.keys(ICON_DATA_BY_NAME),
      control: {
        type: 'select',
      },
      description:
        'Optional icon to display alongside the button text (BasicButton only).',
    },
  },
  render: args => (
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing16}>
      <BasicButtonComponent {...args} />
    </Flex>
  ),
}
