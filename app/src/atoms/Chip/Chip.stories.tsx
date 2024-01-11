import * as React from 'react'
import { Flex, LEGACY_COLORS,
  COLORS, SPACING } from '@opentrons/components'
import { touchScreenViewport } from '../../DesignTokens/constants'
import { Chip } from '.'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/Chip',
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
    backgroundColor={LEGACY_COLORS.darkBlack40}
    width="59rem"
  >
    <Chip {...args} />
  </Flex>
)

export const Basic = Template.bind({})
Basic.args = {
  type: 'basic',
  text: 'Basic chip text',
}

export const Error = Template.bind({})
Error.args = {
  type: 'error',
  text: 'Not connected',
}

export const Success = Template.bind({})
Success.args = {
  type: 'success',
  text: 'Connected',
}

export const Warning = Template.bind({})
Warning.args = {
  type: 'warning',
  text: 'Missing 1 module',
}

export const Neutral = Template.bind({})
Neutral.args = {
  type: 'neutral',
  text: 'Not connected',
}
