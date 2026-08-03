import { ICON_DATA_BY_NAME } from '../../icons/icon-data'
import { STYLE_PROPS } from '../../primitives'
import { SPACING } from '../../ui-style-constants'
import { BasicButton as BasicButtonComponent } from './BasicButton'
import { PrimaryButton as PrimaryButtonComponent } from './PrimaryButton'
import { SecondaryButton as SecondaryButtonComponent } from './SecondaryButton'

import type { Meta, StoryObj } from '@storybook/react'
import type { CSSProperties } from 'react'

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
  },
}

export default meta

const BUTTON_CONTAINER_STYLE: CSSProperties = {
  padding: SPACING.spacing16,
}

export const PrimaryButton: StoryObj<typeof PrimaryButtonComponent> = {
  args: {
    children: 'primary button',
  },
  render: args => (
    <div style={BUTTON_CONTAINER_STYLE}>
      <PrimaryButtonComponent {...args} />
    </div>
  ),
}

export const SecondaryButton: StoryObj<typeof SecondaryButtonComponent> = {
  args: {
    children: 'secondary button',
    isDangerous: false,
  },
  argTypes: {
    isDangerous: {
      control: {
        type: 'boolean',
      },
      description:
        'Styles the button as a dangerous action with non-reversible side effects.',
    },
  },
  render: args => (
    <div style={BUTTON_CONTAINER_STYLE}>
      <SecondaryButtonComponent {...args} />
    </div>
  ),
}

export const WarningPrimaryButton: StoryObj<typeof PrimaryButtonComponent> = {
  args: {
    variant: 'warning',
    children: 'warning primary button',
  },
  render: args => (
    <div style={BUTTON_CONTAINER_STYLE}>
      <PrimaryButtonComponent {...args} />
    </div>
  ),
}

export const AltPrimaryButton: StoryObj<typeof PrimaryButtonComponent> = {
  args: {
    variant: 'alt',
    children: 'alt primary button',
  },
  render: args => (
    <div style={BUTTON_CONTAINER_STYLE}>
      <PrimaryButtonComponent {...args} />
    </div>
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
    <div style={BUTTON_CONTAINER_STYLE}>
      <BasicButtonComponent {...args} />
    </div>
  ),
}
