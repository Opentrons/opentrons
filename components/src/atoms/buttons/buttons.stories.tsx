import { ICON_DATA_BY_NAME } from '../../icons/icon-data'
import { Flex, STYLE_PROPS } from '../../primitives'
import { DIRECTION_ROW } from '../../styles'
import { SPACING } from '../../ui-style-constants'
import { AlertPrimaryButton as AlertPrimaryButtonComponent } from './AlertPrimaryButton'
import { AltPrimaryButton as AltPrimaryButtonComponent } from './AltPrimaryButton'
import { BasicButton as BasicButtonComponent } from './BasicButton'
import { Button as ButtonComponent } from './Button'
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

/**
 * Button is the unified button component using CSS Modules.
 * It supports three variants (default, alert, alt) and customizable border radius.
 * Prefer using this component directly instead of the legacy wrapper components.
 */
export const Button: StoryObj<typeof ButtonComponent> = {
  args: {
    children: 'button',
    variant: 'default',
    borderRadius: '8px',
    disabled: false,
    'aria-disabled': false,
  },
  argTypes: {
    variant: {
      control: {
        type: 'select',
      },
      options: ['default', 'alert', 'alt'],
      description: 'Visual style variant of the button',
    },
    borderRadius: {
      control: {
        type: 'select',
      },
      options: ['8px', '12px', '16px', '200px', '1rem'],
      description: 'Border radius of the button (supports any CSS value)',
    },
    disabled: {
      control: {
        type: 'boolean',
      },
      description: 'Native HTML disabled (removes from tab order)',
    },
    'aria-disabled': {
      control: {
        type: 'boolean',
      },
      description: 'Accessible disabled (keeps in tab order)',
    },
  },
  render: args => (
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing16}>
      <ButtonComponent {...args} />
    </Flex>
  ),
}

/**
 * All button variants displayed side by side for comparison.
 */
export const ButtonVariants: StoryObj<typeof ButtonComponent> = {
  render: () => (
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing16}>
      <ButtonComponent variant="default">Default</ButtonComponent>
      <ButtonComponent variant="alert">Alert</ButtonComponent>
      <ButtonComponent variant="alt">Alt</ButtonComponent>
    </Flex>
  ),
}

/**
 * Button with pill shape (fully rounded borders).
 */
export const ButtonPillShape: StoryObj<typeof ButtonComponent> = {
  render: () => (
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing16}>
      <ButtonComponent variant="default" borderRadius="200px">
        Default Pill
      </ButtonComponent>
      <ButtonComponent variant="alert" borderRadius="200px">
        Alert Pill
      </ButtonComponent>
      <ButtonComponent variant="alt" borderRadius="200px">
        Alt Pill
      </ButtonComponent>
    </Flex>
  ),
}

/**
 * Disabled button states for all variants.
 */
export const ButtonDisabled: StoryObj<typeof ButtonComponent> = {
  render: () => (
    <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing16}>
      <ButtonComponent variant="default" disabled>
        Default Disabled
      </ButtonComponent>
      <ButtonComponent variant="alert" disabled>
        Alert Disabled
      </ButtonComponent>
      <ButtonComponent variant="alt" disabled>
        Alt Disabled
      </ButtonComponent>
    </Flex>
  ),
}

/**
 * Legacy PrimaryButton component (wraps Button with variant="default").
 * @deprecated Use Button component directly with variant="default"
 */
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

/**
 * Legacy AlertPrimaryButton component (wraps Button with variant="alert").
 * @deprecated Use Button component directly with variant="alert"
 */
export const AlertPrimaryButton: StoryObj<typeof AlertPrimaryButtonComponent> =
  {
    args: {
      children: 'alert tertiary button',
    },
    render: args => (
      <Flex>
        <AlertPrimaryButtonComponent {...args} />
      </Flex>
    ),
  }

/**
 * Legacy AltPrimaryButton component (wraps Button with variant="alt").
 * @deprecated Use Button component directly with variant="alt"
 */
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
