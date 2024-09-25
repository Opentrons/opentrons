/* eslint-disable storybook/prefer-pascal-case */
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { Flex } from '../../primitives'
import { LegacyStyledText } from './index'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof LegacyStyledText> = {
  title: 'Library/Atoms/LegacyStyledText',
  component: LegacyStyledText,
  decorators: [
    Story => (
      <Flex padding={SPACING.spacing16}>
        <Story />
      </Flex>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof LegacyStyledText>

const dummyText =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus sapien nunc dolor, aliquet nibh placerat et nisl, arcu. Pellentesque blandit sollicitudin vitae morbi morbi vulputate cursus tellus. Amet proin donec proin id aliquet in nullam.'

export const h1: Story = {
  args: {
    as: 'h1',
    children: dummyText,
  },
}

export const h2: Story = {
  args: {
    as: 'h2',
    children: dummyText,
  },
}

export const h3: Story = {
  args: {
    as: 'h3',
    children: dummyText,
  },
}

export const h6: Story = {
  args: {
    as: 'h6',
    children: dummyText,
  },
}

export const p: Story = {
  args: {
    as: 'p',
    children: dummyText,
  },
}

export const label: Story = {
  args: {
    as: 'label',
    children: dummyText,
  },
}

export const h2SemiBold: Story = {
  args: {
    as: 'h2',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    children: dummyText,
  },
}

export const h3SemiBold: Story = {
  args: {
    as: 'h3',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    children: dummyText,
  },
}

export const h6SemiBold: Story = {
  args: {
    as: 'h6',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    children: dummyText,
  },
}

export const pSemiBold: Story = {
  args: {
    as: 'p',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    children: dummyText,
  },
}

export const labelSemiBold: Story = {
  args: {
    as: 'label',
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    children: dummyText,
  },
}
