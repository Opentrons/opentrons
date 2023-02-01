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

export const Connected = Template.bind({})
Connected.args = {
  text: 'Connected',
  textColor: COLORS.successText,
  iconName: 'ot-check',
  iconColor: COLORS.successEnabled,
  backgroundColor: COLORS.successBackgroundMed,
}

export const NotConnected = Template.bind({})
NotConnected.args = {
  text: 'Not connected',
  textColor: COLORS.darkGreyEnabled,
  iconName: 'ot-check',
  iconColor: COLORS.darkGreyEnabled,
  backgroundColor: COLORS.medGreyEnabled,
}

export const MissingModule = Template.bind({})
MissingModule.args = {
  text: 'Missing 1 module',
  textColor: COLORS.warningText,
  iconName: 'ot-alert',
  iconColor: COLORS.warningEnabled,
  backgroundColor: COLORS.warningBackgroundMed,
}
