import * as React from 'react'
import { Flex, COLORS, ICON_DATA_BY_NAME, SPACING } from '@opentrons/components'
import { touchScreenViewport } from '../../DesignTokens/constants'
import { Chip } from '.'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/Chip',
  argTypes: {
    type: {
      options: ['basic', 'error', 'info', 'neutral', 'success', 'warning'],
      control: {
        type: 'select',
      },
      defaultValue: 'basic',
    },
    hasIcon: {
      control: {
        type: 'boolean',
      },
      defaultValue: true,
    },
    chipSize: {
      options: ['medium', 'small'],
      control: {
        type: 'select',
      },
      defaultValue: 'medium',
    },
    iconName: {
      options: Object.keys(ICON_DATA_BY_NAME),
      control: {
        type: 'select',
      },
      defaultValue: 'ot-alert',
    },
  },
  component: Chip,
  parameters: touchScreenViewport,
} as Meta

interface ChipStorybookProps extends React.ComponentProps<typeof Chip> {
  backgroundColor: string
}

// Note: 59rem(944px) is the size of ODD
const Template: Story<ChipStorybookProps> = ({ ...args }) => (
  <Flex
    padding={SPACING.spacing16}
    backgroundColor={COLORS.grey50}
    width="59rem"
  >
    <Chip {...args} />
  </Flex>
)

export const ChipComponent = Template.bind({})
ChipComponent.args = {
  type: 'basic',
  text: 'Chip component',
  hasIcon: true,
  chipSize: 'medium',
}
