import * as React from 'react'
import { Flex, COLORS, SPACING } from '@opentrons/components'
import { Chip } from '.'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Atoms/Chip',
  component: Chip,
} as Meta

interface ChipStorybookProps extends React.ComponentProps<typeof Chip> {
  backgroundColor: string
}

// Note: 59rem(944px) is the size of ODD
const Template: Story<ChipStorybookProps> = ({ ...args }) => (
  <Flex
    backgroundColor={args.backgroundColor}
    padding={SPACING.spacing4}
    width="59rem"
  >
    <Chip {...args} />
  </Flex>
)

export const Success = Template.bind({})
Success.args = {
  type: 'success',
  text: 'Connected',
  iconName: 'ot-check',
  backgroundColor: COLORS.successBackgroundMed,
}

export const Error = Template.bind({})
Error.args = {
  type: 'error',
  text: 'Error',
  iconName: 'ot-check',
  backgroundColor: COLORS.errorBackgroundMed,
}

export const Warning = Template.bind({})
Warning.args = {
  type: 'warning',
  text: 'Missing 1 module',
  iconName: 'ot-alert',
  backgroundColor: COLORS.warningBackgroundMed,
}

export const Informing = Template.bind({})
Informing.args = {
  type: 'informing',
  text: 'Not connected',
  iconName: 'ot-check',
  backgroundColor: COLORS.medGreyEnabled,
}
