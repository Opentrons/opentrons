import * as React from 'react'
import { COLORS } from '@opentrons/components/src/ui-style-constants'
import { touchScreenViewport } from '../../DesignTokens/constants'
import { ModalHeader } from './ModalHeader'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'ODD/Molecules/Modal/ModalHeader',
  argTypes: {
    iconName: {
      options: ['information', 'ot-check', 'ot-alert', undefined],
      control: { type: 'radio' },
    },
    iconColor: {
      control: {
        type: 'color',
        presetColors: [
          COLORS.black90,
          COLORS.blue50,
          COLORS.red50,
          COLORS.green60,
        ],
      },
    },
    onClick: { action: 'clicked' },
  },
  parameters: touchScreenViewport,
} as Meta

const Template: Story<React.ComponentProps<typeof ModalHeader>> = args => (
  <ModalHeader {...args} />
)
export const Default = Template.bind({})
Default.args = {
  title: 'Header',
  hasExitIcon: true,
  iconName: 'information',
  iconColor: COLORS.black90,
}
