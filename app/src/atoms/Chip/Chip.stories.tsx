import * as React from 'react'
import { Flex, COLORS, SPACING } from '@opentrons/components'
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
}

// export const Error = Template.bind({})
// Error.args = {
//   type: 'error',
//   text: 'Not connected',
// }

// export const Success = Template.bind({})
// Success.args = {
//   type: 'success',
//   text: 'Connected',
// }

// export const Warning = Template.bind({})
// Warning.args = {
//   type: 'warning',
//   text: 'Missing 1 module',
// }

// export const Neutral = Template.bind({})
// Neutral.args = {
//   type: 'neutral',
//   text: 'Not connected',
// }
